// Storage keys
const STORAGE_KEY = 'quotesData';
const SESSION_KEY = 'lastViewedQuote';

// Default quotes
const defaultQuotes = [
  { text: "The only way to do great work is to love what you do.", category: "Motivation" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "Business" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Success" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" }
];

// Initialize quotes array
let quotes = [];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');

// Initialize quotes after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const savedQuotes = localStorage.getItem(STORAGE_KEY);
  quotes = savedQuotes ? JSON.parse(savedQuotes) : [...defaultQuotes];
  init();
});

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

// Export quotes to JSON file
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'quotes-export.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileReader = new FileReader();
  
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => q.text && q.category)) {
        throw new Error('Invalid quotes format');
      }
      
      // Add imported quotes to existing ones
      quotes.push(...importedQuotes);
      saveQuotes();
      updateCategoryFilter();
      showRandomQuote();
      alert(`Successfully imported ${importedQuotes.length} quotes!`);
    } catch (error) {
      console.error('Error importing quotes:', error);
      alert('Error importing quotes. Please check the file format.');
    }
    
    // Reset the file input
    event.target.value = '';
  };
  
  fileReader.onerror = function() {
    alert('Error reading file');
    event.target.value = '';
  };
  
  fileReader.readAsText(file);
}

// Create and return the form for adding new quotes
function createAddQuoteForm() {
  const form = document.createElement('div');
  form.className = 'quote-form';
  form.innerHTML = `
    <h3>Add New Quote</h3>
    <div>
      <input id="newQuoteText" type="text" placeholder="Enter a new quote" required />
    </div>
    <div style="margin-top: 10px;">
      <input id="newQuoteCategory" type="text" placeholder="Enter quote category" required />
    </div>
    <div class="form-actions">
      <button onclick="addQuote()">Add Quote</button>
      <button onclick="exportToJson()" class="secondary">Export Quotes</button>
      <label class="file-upload">
        Import Quotes
        <input type="file" id="importFile" accept=".json" onchange="importFromJsonFile(event)" style="display: none;" />
      </label>
    </div>
  `;
  return form;
}

// Initialize the application
function init() {
  // Add event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', showRandomQuote);
  
  // Initialize categories dropdown
  updateCategoryFilter();
  
  // Create and append the form
  const form = createAddQuoteForm();
  document.body.appendChild(form);
  
    // Show last viewed quote from session storage if available
  const lastQuote = sessionStorage.getItem(SESSION_KEY);
  if (lastQuote) {
    try {
      const lastQuoteData = JSON.parse(lastQuote);
      quoteDisplay.innerHTML = `
        <blockquote>"${lastQuoteData.text}"</blockquote>
        <p><em>— ${lastQuoteData.category}</em></p>
      `;
    } catch (e) {
      console.error('Error parsing last viewed quote:', e);
      showRandomQuote();
    }
  } else {
    // Show initial quote
    showRandomQuote();
  }
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
  
    // Save to session storage
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(randomQuote));
  
  // Display the quote
  quoteDisplay.innerHTML = `
    <blockquote>"${randomQuote.text}"</blockquote>
    <p><em>— ${randomQuote.category}</em></p>
  `;
}

// Add a new quote
function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  
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
  saveQuotes();
  
  // Update UI
  updateCategoryFilter();
  showRandomQuote();
  
  // Clear input fields
  newQuoteText.value = '';
  newQuoteCategory.value = '';
  
  // Focus back to quote text
  newQuoteText.focus();
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
