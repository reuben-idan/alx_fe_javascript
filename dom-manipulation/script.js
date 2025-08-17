// Storage keys
const STORAGE_KEY = 'quotesData';
const SESSION_KEY = 'lastViewedQuote';
const LAST_SYNC_KEY = 'lastSyncTime';
const SERVER_SYNC_INTERVAL = 30000; // 30 seconds

// Server API simulation
const serverApi = {
  // In-memory storage for our mock server
  _data: [
    { id: 1, text: "The only way to do great work is to love what you do.", category: "Motivation", version: 1, updatedAt: new Date().toISOString() },
    { id: 2, text: "Innovation distinguishes between a leader and a follower.", category: "Business", version: 1, updatedAt: new Date().toISOString() },
    { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration", version: 1, updatedAt: new Date().toISOString() },
    { id: 4, text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Success", version: 1, updatedAt: new Date().toISOString() },
    { id: 5, text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration", version: 1, updatedAt: new Date().toISOString() }
  ],
  
  // Simulate network delay
  _simulateNetwork() {
    return new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  },
  
  // Fetch all quotes from server
  async getQuotes() {
    await this._simulateNetwork();
    // Simulate occasional server error (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Failed to fetch quotes: Server error');
    }
    return JSON.parse(JSON.stringify(this._data));
  },
  
  // Add a new quote to server
  async addQuote(quote) {
    await this._simulateNetwork();
    const newQuote = {
      ...quote,
      id: this._data.length > 0 ? Math.max(...this._data.map(q => q.id)) + 1 : 1,
      version: 1,
      updatedAt: new Date().toISOString()
    };
    this._data.push(newQuote);
    return { ...newQuote };
  },
  
  // Update an existing quote on server
  async updateQuote(id, updates) {
    await this._simulateNetwork();
    const index = this._data.findIndex(q => q.id === id);
    if (index === -1) throw new Error('Quote not found');
    
    const updatedQuote = {
      ...this._data[index],
      ...updates,
      version: (this._data[index].version || 1) + 1,
      updatedAt: new Date().toISOString()
    };
    
    this._data[index] = updatedQuote;
    return { ...updatedQuote };
  },
  
  // Sync local changes with server
  async syncQuotes(localQuotes) {
    await this._simulateNetwork();
    const serverQuotes = await this.getQuotes();
    const localMap = new Map(localQuotes.map(q => [q.id, q]));
    
    // Update server with local changes
    for (const localQuote of localQuotes) {
      const serverQuote = serverQuotes.find(q => q.id === localQuote.id);
      
      if (!serverQuote) {
        // New quote - add to server
        await this.addQuote(localQuote);
      } else if ((localQuote.updatedAt > serverQuote.updatedAt) && 
                (localQuote.version > (serverQuote.version || 0))) {
        // Local version is newer - update server
        await this.updateQuote(localQuote.id, localQuote);
      }
    }
    
    // Get updated quotes from server
    return this.getQuotes();
  }
};

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
const syncBtn = document.getElementById('syncBtn');
const syncIcon = document.getElementById('syncIcon');
const syncStatus = document.getElementById('syncStatus');

// Track sync state
let isSyncing = false;

// Fetch quotes from server with retry logic
async function fetchQuotesFromServer(retryCount = 3) {
  try {
    showNotification('Fetching quotes from server...', 'info');
    const serverQuotes = await serverApi.getQuotes();
    return serverQuotes;
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    if (retryCount > 0) {
      showNotification(`Retrying... (${retryCount} attempts left)`, 'warning');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchQuotesFromServer(retryCount - 1);
    }
    throw error;
  }
}

// Initialize quotes after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load from local storage first for immediate UI display
    const savedQuotes = localStorage.getItem(STORAGE_KEY);
    quotes = savedQuotes ? JSON.parse(savedQuotes) : [...defaultQuotes];
    
    // Initialize the app
    init();
    
    // Initial sync with server in background
    syncWithServer().catch(error => {
      console.error('Initial sync failed:', error);
      showNotification('Using offline data. Some features may be limited.', 'warning');
    });
    
    // Set up periodic sync
    setInterval(() => {
      syncWithServer().catch(error => {
        console.error('Periodic sync failed:', error);
      });
    }, SERVER_SYNC_INTERVAL);
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      showNotification('Back online. Syncing with server...', 'info');
      syncWithServer().catch(console.error);
    });
    
    window.addEventListener('offline', () => {
      showNotification('You are currently offline. Working with local data.', 'warning');
    });
    
  } catch (error) {
    console.error('Initialization error:', error);
    showNotification('Error initializing application', 'error');
  }
});

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

// Export quotes to JSON file using Blob API
function exportToJson() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const dataUrl = URL.createObjectURL(dataBlob);
    
    const exportFileDefaultName = `quotes-export-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.href = dataUrl;
    linkElement.download = exportFileDefaultName;
    document.body.appendChild(linkElement);
    linkElement.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(dataUrl);
    }, 100);
  } catch (error) {
    console.error('Error exporting quotes:', error);
    alert('Failed to export quotes. Please try again.');
  }
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
  categoryFilter.addEventListener('change', filterQuotes);
  
  // Initialize categories dropdown
  populateCategories();
  
  // Create and append the form
  const form = createAddQuoteForm();
  document.body.appendChild(form);
  
  // Update sync button state
  function setSyncState(syncing) {
    isSyncing = syncing;
    syncBtn.disabled = syncing;
    syncBtn.classList.toggle('syncing', syncing);
    syncIcon.classList.toggle('syncing', syncing);
    syncStatus.textContent = syncing ? 'Syncing...' : 'Sync';
  }

  // Set up sync button
  syncBtn.addEventListener('click', () => {
    if (!isSyncing) {
      syncWithServer();
    }
  });
  
  // Show last viewed quote from session storage if available
  const lastQuote = sessionStorage.getItem(SESSION_KEY);
  const lastCategory = localStorage.getItem('lastSelectedCategory') || 'all';
  
  if (lastQuote && lastCategory === 'all') {
    try {
      const lastQuoteData = JSON.parse(lastQuote);
      quoteDisplay.innerHTML = `
        <blockquote>"${lastQuoteData.text}"</blockquote>
        <p><em>— ${lastQuoteData.category}</em></p>
      `;
    } catch (e) {
      console.error('Error parsing last viewed quote:', e);
      filterQuotes();
    }
  } else {
    // Show filtered or random quote based on last selected category
    filterQuotes();
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

// Show notification to user
function showNotification(message, type = 'info') {
  const notifications = document.getElementById('notifications');
  if (!notifications) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-icon">
      ${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
    </div>
    <div class="notification-content">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  
  // Add close button handler
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  });
  
  notifications.appendChild(notification);
  
  // Auto-remove after 5 seconds
  const timeout = setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
  
  // Keep notification on hover
  notification.addEventListener('mouseenter', () => clearTimeout(timeout));
  notification.addEventListener('mouseleave', () => {
    const newTimeout = setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
    notification.dataset.timeout = newTimeout;
  });
}

// Update last sync time display
function updateLastSyncTime() {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (!lastSync) return;
  
  const syncTimeElement = document.getElementById('lastSyncTime');
  if (syncTimeElement) {
    const lastSyncDate = new Date(lastSync);
    syncTimeElement.textContent = `Last synced: ${lastSyncDate.toLocaleTimeString()}`;
    syncTimeElement.title = `Last sync: ${lastSyncDate.toString()}`;
  }
}

// Sync local data with server
async function syncWithServer() {
  if (isSyncing) return false;
  
  setSyncState(true);
  
  try {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    
    // 1. Fetch latest quotes from server
    const serverQuotes = await fetchQuotesFromServer();
    
    // 2. Check for conflicts and resolve them
    const { hasConflicts, resolvedQuotes } = await resolveConflicts(quotes, serverQuotes);
    
    // 3. Merge server quotes with local ones
    const mergedQuotes = mergeQuotes(quotes, resolvedQuotes);
    
    // 4. Update local storage if there are changes
    let changesDetected = false;
    if (JSON.stringify(quotes) !== JSON.stringify(mergedQuotes)) {
      changesDetected = true;
      const previousCount = quotes.length;
      quotes = mergedQuotes;
      saveQuotes();
      populateCategories();
      
      // Show appropriate notification
      if (hasConflicts) {
        showNotification(`Resolved conflicts. ${quotes.length - previousCount} new/updated quotes.`, 'warning');
      } else {
        showNotification(`Synced successfully. ${quotes.length - previousCount} new/updated quotes.`, 'success');
      }
      
      // Update the UI if needed
      if (categoryFilter.value === 'all') {
        showRandomQuote();
      } else {
        filterQuote();
      }
    } else {
      showNotification('Already up to date', 'info');
    }
    
    // 5. Push local changes to server
    try {
      const updatedServerQuotes = await serverApi.syncQuotes(quotes);
      
      // 6. Update local data with any server-side changes
      if (updatedServerQuotes) {
        const finalMerged = mergeQuotes(quotes, updatedServerQuotes);
        if (JSON.stringify(quotes) !== JSON.stringify(finalMerged)) {
          quotes = finalMerged;
          saveQuotes();
          showNotification('Updated with server changes', 'info');
        }
      }
    } catch (syncError) {
      console.error('Error pushing changes to server:', syncError);
      showNotification('Changes saved locally but could not sync with server', 'warning');
    }
    
    // Update last sync time
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    updateLastSyncTime();
    
    return changesDetected;
    
  } catch (error) {
    console.error('Sync error:', error);
    
    // Show appropriate error message
    if (error.message.includes('network')) {
      showNotification('Network error. Working offline.', 'error');
    } else {
      showNotification('Failed to sync with server', 'error');
    }
    
    return false;
  } finally {
    setSyncState(false);
  }
}

// Check for and resolve conflicts between local and server data
async function resolveConflicts(localQuotes, serverQuotes) {
  const localMap = new Map(localQuotes.map(q => [q.id, q]));
  const conflicts = [];
  
  // Find conflicts (same ID but different content)
  for (const serverQuote of serverQuotes) {
    const localQuote = localMap.get(serverQuote.id);
    if (localQuote && 
        JSON.stringify(localQuote) !== JSON.stringify(serverQuote) &&
        localQuote.updatedAt && serverQuote.updatedAt &&
        localQuote.updatedAt !== serverQuote.updatedAt) {
      conflicts.push({ local: localQuote, server: serverQuote });
    }
  }
  
  // If no conflicts, return the server data
  if (conflicts.length === 0) {
    return { hasConflicts: false, resolvedQuotes: serverQuotes };
  }
  
  // In a real app, you might show a UI to let the user resolve conflicts
  // For this example, we'll use a simple strategy: server wins
  console.log(`Resolved ${conflicts.length} conflicts`);
  
  // Apply server changes for conflicts
  const resolved = [...localQuotes];
  for (const { local, server } of conflicts) {
    const index = resolved.findIndex(q => q.id === local.id);
    if (index !== -1) {
      resolved[index] = { ...local, ...server, version: (local.version || 1) + 1 };
    }
  }
  
  return { hasConflicts: true, resolvedQuotes: resolved };
}

// Merge local and server quotes
function mergeQuotes(localQuotes, serverQuotes) {
  const merged = [...localQuotes];
  const serverMap = new Map(serverQuotes.map(q => [q.id, q]));
  const localIds = new Set(localQuotes.map(q => q.id));
  
  // Add or update quotes from server
  for (const serverQuote of serverQuotes) {
    const localIndex = merged.findIndex(q => q.id === serverQuote.id);
    
    if (localIndex === -1) {
      // New quote from server
      merged.push(serverQuote);
    } else {
      // Update existing quote
      merged[localIndex] = {
        ...merged[localIndex],
        ...serverQuote,
        // Preserve local category if it was modified
        category: merged[localIndex].category || serverQuote.category,
        // Update version
        version: (serverQuote.version || 1) + 1,
        // Track when this was last updated
        updatedAt: new Date().toISOString()
      };
    }
  }
  
  // Add any local quotes that aren't on the server
  for (const localQuote of localQuotes) {
    if (!serverMap.has(localQuote.id)) {
      merged.push({
        ...localQuote,
        // Mark as local only
        source: 'local',
        // Set initial version if not set
        version: localQuote.version || 1,
        // Set creation time if not set
        createdAt: localQuote.createdAt || new Date().toISOString()
      });
    }
  }
  
  return merged;
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
  
  // Update UI and categories
  populateCategories();
  
  // If the new quote's category matches the current filter, show it
  const currentCategory = categoryFilter.value;
  if (currentCategory === 'all' || currentCategory === category) {
    const quoteElement = document.createElement('div');
    quoteElement.className = 'quote';
    quoteElement.innerHTML = `
      <blockquote>"${text}"</blockquote>
      <p><em>— ${category}</em></p>
    `;
    quoteDisplay.innerHTML = '';
    quoteDisplay.appendChild(quoteElement);
  }
  
  // Clear input fields
  newQuoteText.value = '';
  newQuoteCategory.value = '';
  
  // Focus back to quote text
  newQuoteText.focus();
  
  // Show success message
  showNotification('Quote added successfully!', 'success');
  
  // Sync with server in background
  syncWithServer().catch(console.error);
}

// Extract unique categories and populate the dropdown
function populateCategories() {
  // Get all unique categories from quotes
  const categories = ['all', ...new Set(quotes.map(quote => quote.category))];
  
  // Get last selected category from local storage
  const lastSelectedCategory = localStorage.getItem('lastSelectedCategory') || 'all';
  
  // Clear and repopulate dropdown
  categoryFilter.innerHTML = '';
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category === 'all' ? 'All Categories' : 
                         category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });
  
  // Restore last selected category if it exists
  if (categories.includes(lastSelectedCategory)) {
    categoryFilter.value = lastSelectedCategory;
  } else {
    categoryFilter.value = 'all';
    localStorage.setItem('lastSelectedCategory', 'all');
  }
}

// Alias for backward compatibility
const updateCategoryFilter = populateCategories;

// Filter and update displayed quotes based on selected category
function filterQuote() {
  const selectedCategory = categoryFilter.value;
  
  // Save the selected category to local storage
  localStorage.setItem('lastSelectedCategory', selectedCategory);
  
  // If 'all' is selected, show a random quote from all categories
  if (selectedCategory === 'all') {
    showRandomQuote();
    return;
  }
  
  // Filter quotes by selected category
  const filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `
      <div class="no-quotes">
        <p>No quotes found in category: <strong>${selectedCategory}</strong></p>
        <button onclick="addQuote()">Add a quote to this category</button>
      </div>`;
    return;
  }
  
  // Show a random quote from the filtered list
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  
  // Save to session storage
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(randomQuote));
  
  // Display the quote
  quoteDisplay.innerHTML = `
    <div class="quote">
      <blockquote>"${randomQuote.text}"</blockquote>
      <p class="category"><em>— ${randomQuote.category}</em></p>
    </div>`;
}

// Alias for backward compatibility
const filterQuotes = filterQuote;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
