const { cosineSimilarity } = require('./similarity');

/**
 * Calculates the final candidate score based on the Hybrid Semantic Architecture.
 * Weights:
 * - Domain & General Semantic Relevance -> 40%
 * - Explicit Normalized Skills Match -> 25%
 * - Projects Semantic Relevance -> 15%
 * - Certification Bonus -> 10%
 * - Achievement Bonus -> 10%
 */
function calculateFinalScore(
  jdEmbeddings, 
  resumeEmbeddings, 
  jdEntities, 
  resumeEntities, 
  resumeSections
) {
  
  const explanations = {
    matchedDomains: [],
    rejectedDomains: [],
    matchedSkills: [],
    missingSkills: []
  };

  // 1. Semantic & Domain Score (40%)
  // We compute similarity between overall semantic text and the targeted domain embeddings.
  const overallSim = cosineSimilarity(jdEmbeddings.semantic, resumeEmbeddings.semantic);
  const domainSim = cosineSimilarity(jdEmbeddings.domain, resumeEmbeddings.domain);
  
  // Blend overall semantic context with strict domain context
  const blendedSemanticScore = ((overallSim * 0.4) + (domainSim * 0.6)) * 100;
  
  // Explain Domains
  resumeEntities.domains.forEach(d => {
    if (jdEntities.domains.includes(d)) explanations.matchedDomains.push(d);
    else explanations.rejectedDomains.push(d);
  });

  // 2. Exact/Normalized Skills Match (25%)
  // How many of the JD's normalized skills does the candidate have?
  let skillMatchCount = 0;
  const totalJdSkills = jdEntities.normalizedSkills.length;
  
  jdEntities.normalizedSkills.forEach(skill => {
    if (resumeEntities.normalizedSkills.includes(skill)) {
      skillMatchCount++;
      explanations.matchedSkills.push(skill);
    } else {
      explanations.missingSkills.push(skill);
    }
  });

  // If JD has no skills (rare), fallback to semantic score. Otherwise calculate percentage.
  let skillsScore = 0;
  if (totalJdSkills > 0) {
    skillsScore = (skillMatchCount / totalJdSkills) * 100;
  } else {
    skillsScore = blendedSemanticScore;
  }

  // 3. Project Contextual Relevance (15%)
  // Compare JD embedding against ONLY the candidate's projects section.
  const projectSim = cosineSimilarity(jdEmbeddings.semantic, resumeEmbeddings.project);
  let projectScore = projectSim * 100;
  // If no projects section exists, penalty.
  if (!resumeSections.projects || resumeSections.projects.trim().length < 10) {
    projectScore = 0;
  }

  // 4. Certification & Achievement Scores (10% each)
  let certScore = 0;
  if (resumeSections.certifications && resumeSections.certifications.length > 20) {
    certScore = 50; 
    const certsLower = resumeSections.certifications.toLowerCase();
    // High-value tech certs boost score
    if (certsLower.includes('aws') || certsLower.includes('cloud') || certsLower.includes('azure') || certsLower.includes('oracle')) certScore += 25;
    if (certsLower.includes('nptel') || certsLower.includes('coursera') || certsLower.includes('udemy') || certsLower.includes('google')) certScore += 25;
    certScore = Math.min(certScore, 100);
  }

  let achScore = 0;
  if (resumeSections.achievements && resumeSections.achievements.length > 20) {
    achScore = 50; 
    const achLower = resumeSections.achievements.toLowerCase();
    if (achLower.includes('hackathon') || achLower.includes('leetcode') || achLower.includes('codeforces') || achLower.includes('winner')) achScore += 50;
    achScore = Math.min(achScore, 100);
  }

  // Calculate Weighted Final Score
  const finalScore = (
    (blendedSemanticScore * 0.40) + 
    (skillsScore * 0.25) + 
    (projectScore * 0.15) + 
    (certScore * 0.10) + 
    (achScore * 0.10)
  );

  return {
    semanticScore: Math.round(blendedSemanticScore),
    skillsScore: Math.round(skillsScore),
    projectScore: Math.round(projectScore),
    certScore: Math.round(certScore),
    achScore: Math.round(achScore),
    finalScore: Math.round(finalScore),
    explanations
  };
}

module.exports = {
  calculateFinalScore
};
