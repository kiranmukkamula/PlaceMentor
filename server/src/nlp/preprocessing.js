const natural = require('natural');
const sw = require('stopword');

// Initialize natural tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();

/**
 * Preprocesses text by lowercasing, removing punctuation, 
 * tokenizing, removing stopwords, and stemming.
 * 
 * @param {string} text The raw text to process
 * @returns {Array<string>} Array of processed tokens
 */
function preprocessText(text) {
  if (!text) return [];

  // 1. Lowercase
  let cleanText = text.toLowerCase();

  // 2. Remove special characters and numbers (keeping only letters and some common tech symbols like . or +)
  // We keep + for C++, # for C#, . for Node.js
  cleanText = cleanText.replace(/[^a-z+#.]/g, ' ');

  // 3. Tokenize
  const tokens = tokenizer.tokenize(cleanText);

  // 4. Remove stopwords
  const noStopwords = sw.removeStopwords(tokens);

  // 5. Stemming (optional, but good for normalizing words like 'developing' -> 'develop')
  // We might want to skip stemming for technical keywords to avoid breaking them (e.g., nodejs -> nodej)
  // Let's just return normalized tokens without heavy stemming for tech terms
  
  // Clean up duplicate tokens and empty strings
  const uniqueTokens = [...new Set(noStopwords.filter(t => t.length > 1))];

  return uniqueTokens;
}

module.exports = {
  preprocessText
};
