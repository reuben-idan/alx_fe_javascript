// Mock server implementation for Dynamic Quote Generator

// In-memory storage for our mock server
let serverData = [
  { id: 1, text: "The only way to do great work is to love what you do.", category: "Motivation", version: 1 },
  { id: 2, text: "Innovation distinguishes between a leader and a follower.", category: "Business", version: 1 },
  { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration", version: 1 },
  { id: 4, text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Success", version: 1 },
  { id: 5, text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration", version: 1 }
];

// Generate a unique ID for new quotes
let nextId = serverData.length + 1;

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get all quotes
const getQuotes = async () => {
  await delay(300); // Simulate network delay
  return [...serverData];
};

// Add a new quote
const addQuote = async (quote) => {
  await delay(300);
  const newQuote = {
    ...quote,
    id: nextId++,
    version: 1,
    createdAt: new Date().toISOString()
  };
  serverData.push(newQuote);
  return newQuote;
};

// Update an existing quote
const updateQuote = async (id, updates) => {
  await delay(300);
  const index = serverData.findIndex(q => q.id === id);
  if (index === -1) throw new Error('Quote not found');
  
  const updatedQuote = {
    ...serverData[index],
    ...updates,
    version: (serverData[index].version || 1) + 1,
    updatedAt: new Date().toISOString()
  };
  
  serverData[index] = updatedQuote;
  return updatedQuote;
};

// Delete a quote
const deleteQuote = async (id) => {
  await delay(300);
  const index = serverData.findIndex(q => q.id === id);
  if (index === -1) throw new Error('Quote not found');
  
  const [deleted] = serverData.splice(index, 1);
  return deleted;
};

// Simulate server API
const api = {
  getQuotes,
  addQuote,
  updateQuote,
  deleteQuote,
  // For testing purposes
  _getServerData: () => [...serverData],
  _setServerData: (data) => { serverData = [...data]; }
};

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else {
  window.QuoteServer = api;
}
