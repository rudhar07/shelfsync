import { auth } from './firebase-config.js';

// Book display and search functionality
const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';

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

        const response = await fetch(`${GOOGLE_BOOKS_API_BASE}${searchQuery}&maxResults=20`);
        const data = await response.json();

        if (!data.items) return [];
        return data.items;
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
}

// Create book card HTML
function createBookCard(book) {
    const { volumeInfo } = book;
    const thumbnail = volumeInfo.imageLinks?.thumbnail || 'placeholder-book.png';
    const title = volumeInfo.title || 'Untitled';
    const authors = volumeInfo.authors?.join(', ') || 'Unknown Author';
    const description = volumeInfo.description?.substring(0, 150) + '...' || 'No description available';

    return `
        <div class="book-card">
            <img src="${thumbnail}" alt="${title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">By ${authors}</p>
                <p class="book-description">${description}</p>
            </div>
        </div>
    `;
}

// Display books in the main content area
function displayBooks(books) {
    const mainContent = document.getElementById('mainContent');
    if (books.length === 0) {
        mainContent.innerHTML = '<p class="no-results">No books found</p>';
        return;
    }

    const booksHTML = books.map(createBookCard).join('');
    mainContent.innerHTML = `<div class="books-grid">${booksHTML}</div>`;
}

// Initialize books display
async function initializeBooksDisplay() {
    const books = await fetchBooks();
    displayBooks(books);
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
            initializeBooksDisplay();
            updateSearchHandler();
        } else {
            if (!sessionStorage.getItem('reloaded')) {
                sessionStorage.setItem('reloaded', 'true');
                location.reload();
            } else {
                sessionStorage.removeItem('reloaded');
            }
        }
    });
});

export { initializeBooksDisplay, updateSearchHandler };