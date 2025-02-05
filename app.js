// Main application logic
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');

  // Handle search
  const handleSearch = (query) => {
      console.log('Searching for:', query);
      // Will implement search functionality later
  };

  // Event listeners
  searchBtn.addEventListener('click', () => {
      handleSearch(searchInput.value);
  });

  searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
          handleSearch(searchInput.value);
      }
  });
});