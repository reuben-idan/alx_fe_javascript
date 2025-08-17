// Initial quotes array
let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "Motivation" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "Business" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Success" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');

// Initialize the application
function init() {
  // Add event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', showRandomQuote);
  
  // Initialize categories dropdown
  updateCategoryFilter();
  
  // Show initial quote
  showRandomQuote();
}

// Display a random quote
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;
  
  // Filter quotes by category if not 'all'
  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }
  
  // If no quotes in the selected category, show a message
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = '<p>No quotes found in this category. Add some quotes!</p>';
    return;
  }
  
  // Get a random quote
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  
  // Display the quote
  quoteDisplay.innerHTML = `
    <blockquote>"${randomQuote.text}"</blockquote>
    <p><em>— ${randomQuote.category}</em></p>
  `;
}

// Add a new quote
function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();
  
  // Validate input
  if (!text || !category) {
    alert('Please enter both a quote and a category');
    return;
  }
  
  // Create new quote object
  const newQuote = {
    text: text,
    category: category
  };
  
  // Add to quotes array
  quotes.push(newQuote);
  
  // Update UI
  updateCategoryFilter();
  showRandomQuote();
  
  // Clear input fields
  newQuoteText.value = '';
  newQuoteCategory.value = '';
  
  // Show success message
  alert('Quote added successfully!');
}

// Update category filter dropdown
function updateCategoryFilter() {
  // Get all unique categories
  const categories = ['all', ...new Set(quotes.map(quote => quote.category))];
  
  // Save current selection
  const currentSelection = categoryFilter.value;
  
  // Clear and repopulate dropdown
  categoryFilter.innerHTML = '';
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });
  
  // Restore selection if possible
  if (categories.includes(currentSelection)) {
    categoryFilter.value = currentSelection;
  } else {
    categoryFilter.value = 'all';
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
