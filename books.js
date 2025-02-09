import { auth, db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    deleteDoc,
    doc 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';

async function saveBook(bookId) {
    if (!auth.currentUser) return;
    
    try {
        const bookElement = document.querySelector(`[data-book-id="${bookId}"]`);
        if (!bookElement) {
            throw new Error('Book not found in current display');
        }

        const bookData = {
            userId: auth.currentUser.uid,
            bookId: bookId,
            title: bookElement.querySelector('.book-title').textContent,
            authors: bookElement.querySelector('.book-author').textContent.replace('By ', '').split(', '),
            thumbnail: bookElement.querySelector('.book-cover').src,
            description: bookElement.querySelector('.book-description').textContent,
            savedAt: new Date().toISOString()
        };

        const existingBook = await checkIfBookExists(bookId);
        if (existingBook) {
            alert('This book is already saved!');
            return;
        }

        await addDoc(collection(db, 'savedBooks'), bookData);
        alert('Book saved successfully!');
        
        // Replace save button with remove button
        const actionBtn = bookElement.querySelector('.book-action-btn');
        actionBtn.textContent = 'Remove';
        actionBtn.classList.remove('save-btn');
        actionBtn.classList.add('remove-btn');
        
        // Update click handler
        actionBtn.removeEventListener('click', saveBook);
        actionBtn.addEventListener('click', () => removeSavedBook(bookId));
    } catch (error) {
        console.error('Error saving book:', error);
        alert('Failed to save book. Please try again.');
    }
}

// Remove book from saved collection
async function removeSavedBook(bookId) {
    if (!auth.currentUser) return;

    try {
        const savedBooksRef = collection(db, 'savedBooks');
        const q = query(
            savedBooksRef, 
            where('userId', '==', auth.currentUser.uid),
            where('bookId', '==', bookId)
        );
        
        const querySnapshot = await getDocs(q);
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'savedBooks', docToDelete.id));
        alert('Book removed from saved collection');

        // Get the book element and update its button
        const bookElement = document.querySelector(`[data-book-id="${bookId}"]`);
        if (bookElement) {
            const actionBtn = bookElement.querySelector('.book-action-btn');
            actionBtn.textContent = 'Save';
            actionBtn.classList.remove('remove-btn');
            actionBtn.classList.add('save-btn');
            
            // Update click handler
            actionBtn.removeEventListener('click', removeSavedBook);
            actionBtn.addEventListener('click', () => saveBook(bookId));
        }
    } catch (error) {
        console.error('Error removing book:', error);
        alert('Failed to remove book. Please try again.');
    }
}

async function fetchSavedBooks() {
    if (!auth.currentUser) return [];

    try {
        const savedBooksRef = collection(db, 'savedBooks');
        const q = query(savedBooksRef, where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            firestoreId: doc.id
        }));
    } catch (error) {
        console.error('Error fetching saved books:', error);
        return [];
    }
}



// Fetch books from Google Books API
async function fetchBooks(query = '', filters = {}) {
    try {
        let searchQuery = query ? `?q=${encodeURIComponent(query)}` : '?q=books';

        // Add genre to search query if selected
        if (filters.genre) {
            searchQuery += `+subject:${filters.genre}`;
        }

        // Add language filter if selected
        if (filters.language) {
            searchQuery += `&langRestrict=${filters.language}`;
        }

        const response = await fetch(`${GOOGLE_BOOKS_API_BASE}${searchQuery}&maxResults=40`);
        const data = await response.json();

        if (!data.items) return [];
        return data.items;
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
}

async function fetchRecommendedBooks() {
    try {
        // Fetch popular books in different genres
        const genres = ['fiction', 'science_fiction', 'mystery', 'romance'];
        const promises = genres.map(async (genre) => {
            const searchQuery = `?q=subject:${genre}&orderBy=relevance`;
            const response = await fetch(`${GOOGLE_BOOKS_API_BASE}${searchQuery}&maxResults=10`);
            const data = await response.json();
            return data.items || [];
        });
        
        const results = await Promise.all(promises);
        const recommendations = results.flat().slice(0, 40); // Limit to 40 total books
        return recommendations;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

// Create book card HTML
async function createBookCard(book, isSaved = false) {
    const isGoogleBook = !!book.volumeInfo;
    
    const bookDetails = {
        id: isGoogleBook ? book.id : book.bookId,
        thumbnail: isGoogleBook 
            ? (book.volumeInfo.imageLinks?.thumbnail || 'placeholder-book.png')
            : (book.thumbnail || 'placeholder-book.png'),
        title: isGoogleBook 
            ? (book.volumeInfo.title || 'Untitled')
            : (book.title || 'Untitled'),
        authors: isGoogleBook 
            ? (book.volumeInfo.authors?.join(', ') || 'Unknown Author')
            : (Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author'),
        description: isGoogleBook
            ? (book.volumeInfo.description?.substring(0, 150) + '...' || 'No description available')
            : (book.description?.substring(0, 150) + '...' || 'No description available')
    };

    // Only show buttons if user is logged in
    let saveButtonHtml = '';
    if (auth.currentUser) {
        // Check if the book is already saved
        const isBookSaved = isSaved || await checkIfBookExists(bookDetails.id);
        
        saveButtonHtml = `
            <button class="book-action-btn ${isBookSaved ? 'remove-btn' : 'save-btn'}" data-book-id="${bookDetails.id}">
                ${isBookSaved ? 'Remove' : 'Save'}
            </button>
        `;
    }

    return `
        <div class="book-card" data-book-id="${bookDetails.id}">
            <img src="${bookDetails.thumbnail}" alt="${bookDetails.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${bookDetails.title}</h3>
                <p class="book-author">By ${bookDetails.authors}</p>
                <p class="book-description">${bookDetails.description}</p>
                ${saveButtonHtml}
            </div>
        </div>
    `;
}

async function checkIfBookExists(bookId) {
    if (!auth.currentUser) return false;

    try {
        const savedBooksRef = collection(db, 'savedBooks');
        const q = query(
            savedBooksRef, 
            where('userId', '==', auth.currentUser.uid),
            where('bookId', '==', bookId)
        );
        
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking book existence:', error);
        return false;
    }
}


// Display books in the main area
async function displayBooks(books, isSavedPage = false) {
    const mainContent = document.getElementById('mainContent');
    if (books.length === 0) {
        mainContent.innerHTML = `<p class="no-results">
            ${isSavedPage ? 'No saved books found' : 'No books found'}
        </p>`;
        return;
    }

    // Create all book cards (now handles async operations)
    const bookCardsPromises = books.map(book => createBookCard(book, isSavedPage));
    const bookCards = await Promise.all(bookCardsPromises);
    
    mainContent.innerHTML = `<div class="books-grid">${bookCards.join('')}</div>`;

    // Add event listeners to all book action buttons
    document.querySelectorAll('.book-action-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const bookId = e.target.dataset.bookId;
            if (button.classList.contains('remove-btn')) {
                await removeSavedBook(bookId);
                if (isSavedPage) {
                    // Refresh the saved books display after removal
                    initializePageContent('saved');
                }
            } else {
                await saveBook(bookId);
            }
        });
    });
}

async function initializePageContent(page = 'home') {
    const books = page === 'home' 
        ? await fetchRecommendedBooks()
        : await fetchSavedBooks();
    
    displayBooks(books, page === 'saved');
}

function setupNavigation() {
    const homeLink = document.getElementById('homeLink');
    const savedLink = document.getElementById('savedLink');

    if (!homeLink || !savedLink) {
        console.error('Navigation links not found');
        return;
    }

    // Remove any existing event listeners
    homeLink.replaceWith(homeLink.cloneNode(true));
    savedLink.replaceWith(savedLink.cloneNode(true));

    // Get the fresh elements
    const newHomeLink = document.getElementById('homeLink');
    const newSavedLink = document.getElementById('savedLink');

    newHomeLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-links a.active')?.classList.remove('active');
        newHomeLink.classList.add('active');
        initializePageContent('home');
    });

    newSavedLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-links a.active')?.classList.remove('active');
        newSavedLink.classList.add('active');
        initializePageContent('saved');
    });
}

// Update search functionality
function updateSearchHandler() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    const genreSelect = document.getElementById('genreSelect');
    const yearFrom = document.getElementById('yearFrom');
    const yearTo = document.getElementById('yearTo');
    const languageSelect = document.getElementById('languageSelect');

    const handleSearch = async () => {
        const filters = {
            genre: genreSelect.value,
            yearFrom: yearFrom.value ? parseInt(yearFrom.value) : null,
            yearTo: yearTo.value ? parseInt(yearTo.value) : null,
            language: languageSelect.value
        };
        
        const books = await fetchBooks(searchInput.value, filters);
        displayBooks(books);
    };

    // Add event listeners for all filter changes
    [searchBtn, genreSelect, languageSelect].forEach(element => {
        element.addEventListener('change', handleSearch);
    });

    [yearFrom, yearTo].forEach(element => {
        element.addEventListener('change', () => {
            if ((!yearFrom.value || yearFrom.value >= 1800) && 
                (!yearTo.value || yearTo.value <= 2024)) {
                handleSearch();
            }
        });
    });

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            try {
                setupNavigation();
                // Set home as active by default
                document.getElementById('homeLink')?.classList.add('active');
                initializePageContent('home');
                updateSearchHandler();
            } catch (error) {
                console.error('Error initializing page:', error);
            }
        } else {
            // Handle not logged in state
            console.log('User not logged in');
        }
    });
});

export { 
    initializePageContent, 
    updateSearchHandler, 
    saveBook, 
    removeSavedBook 
};