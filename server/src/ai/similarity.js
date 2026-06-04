/**
 * Computes Cosine Similarity between two arrays of numbers.
 * @param {Array<number>} vecA 
 * @param {Array<number>} vecB 
 * @returns {number} similarity score between 0 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  // Value between -1 and 1
  let similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  
  // Normalize to 0 to 1 range (since embeddings might have negative correlations, though all-MiniLM mostly outputs positive)
  // Or just clamp between 0 and 1
  similarity = Math.max(0, similarity);
  
  return similarity;
}

module.exports = {
  cosineSimilarity
};
