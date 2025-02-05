// Book display and search functionality
const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';

// Fetch books from Google Books API
async function fetchBooks(query = '', maxResults = 20) {
    try {
        const searchQuery = query ? `?q=${encodeURIComponent(query)}` : '?q=subject:fiction'; // Default to fiction books if no query
        const response = await fetch(`${GOOGLE_BOOKS_API_BASE}${searchQuery}&maxResults=${maxResults}`);
        const data = await response.json();
        return data.items || [];
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

    const handleSearch = async (query) => {
        const books = await fetchBooks(query);
        displayBooks(books);
    };

    searchBtn.addEventListener('click', () => {
        handleSearch(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchInput.value);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeBooksDisplay();
    updateSearchHandler();
});

export { initializeBooksDisplay, updateSearchHandler };