const { pipeline } = require('@xenova/transformers');

// Global variable to hold the feature extractor pipeline
let featureExtractor = null;

/**
 * Initializes the Transformers.js pipeline.
 * We use Xenova/all-MiniLM-L6-v2 which is small, fast, and excellent for semantic similarity.
 */
async function initPipeline() {
  if (!featureExtractor) {
    console.log("Loading Xenova/all-MiniLM-L6-v2 model for embeddings...");
    featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("Model loaded successfully.");
  }
  return featureExtractor;
}

/**
 * Generates an embedding vector for a given text.
 * @param {string} text The text to embed
 * @returns {Promise<Array<number>>} The float array embedding
 */
async function generateEmbedding(text) {
  if (!text || text.trim() === '') {
    // Return a zero vector of size 384 (size of all-MiniLM-L6-v2 embeddings)
    return new Array(384).fill(0);
  }

  try {
    const extractor = await initPipeline();
    // generate embeddings
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    // output is a tensor, we convert it to a normal JS array
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating embedding:", error);
    // fallback
    return new Array(384).fill(0);
  }
}

module.exports = {
  generateEmbedding
};
