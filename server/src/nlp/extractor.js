const { normalizeSkill, getDomainsForSkills, skillNormalization, domainOntology, expandMacroSkills } = require('./ontology');
const natural = require('natural');

/**
 * Extracts distinct sections from the resume text using Regex heuristics.
 * @param {string} text Raw resume text
 * @returns {Object} Extracted sections
 */
function extractSections(text) {
  const sections = {
    skills: '',
    projects: '',
    experience: '',
    education: '',
    certifications: '',
    achievements: ''
  };

  if (!text) return sections;

  // Split text into lines for heuristic parsing
  const lines = text.split('\n');
  let currentSection = null;

  // Regex patterns to identify section headers
  const patterns = {
    skills: /^(skills|technologies|technical skills|it skills|core competencies)/i,
    projects: /^(projects|academic projects|personal projects|development projects)/i,
    experience: /^(experience|work experience|employment history|professional experience|internships)/i,
    education: /^(education|academic qualifications|academics)/i,
    certifications: /^(certifications|certificates|courses)/i,
    achievements: /^(achievements|awards|honors|extracurricular)/i
  };

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let isHeader = false;
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(trimmed) && trimmed.length < 50) { 
        currentSection = key;
        isHeader = true;
        break;
      }
    }

    if (isHeader) continue;

    if (currentSection) {
      sections[currentSection] += trimmed + ' \n';
    }
  }

  return sections;
}

/**
 * Advanced NER-style technical entity and phrase extractor.
 * Detects multi-word skills (n-grams) to avoid splitting "machine learning".
 * Includes Fuzzy Matching to handle typos like "numspy" or "pands".
 * 
 * @param {string} text The block of text to analyze
 * @returns {Object} Extracted skills, normalized skills, expanded skills, and associated domains
 */
function extractTechnicalEntities(text) {
  if (!text) return { explicitSkills: [], normalizedSkills: [], expandedSkills: [], domains: [] };

  const lowerText = text.toLowerCase().replace(/[\n\t]/g, ' ');
  
  // 1. Build a fast lookup of all known skills and variations from our ontology
  const allKnownPhrases = new Set([
    ...Object.keys(skillNormalization),
    ...Object.values(skillNormalization),
    ...Object.values(domainOntology).flat()
  ]);

  // Sort by length descending to match longest phrases first (e.g., "amazon web services" before "amazon")
  const sortedPhrases = Array.from(allKnownPhrases).sort((a, b) => b.length - a.length);

  let explicitSkills = new Set();
  let normalizedSkills = new Set();

  // 2. Direct regex heuristics for high-level placement JD terms
  if (/cs fundamentals|computer science fundamentals|core cs|cs core/i.test(lowerText)) {
    explicitSkills.add('cs fundamentals');
    normalizedSkills.add('cs fundamentals');
  }

  if (/development skills|software development|web development|dev skills|development/i.test(lowerText)) {
    explicitSkills.add('development skills');
    normalizedSkills.add('development skills');
  }

  // 3. Exact Phrase matching (NER)
  sortedPhrases.forEach(phrase => {
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s|[.,;()/-])${escapedPhrase}(\\s|[.,;()/-]|$)`, 'gi');
    
    if (regex.test(lowerText)) {
      explicitSkills.add(phrase);
      const canonical = normalizeSkill(phrase);
      normalizedSkills.add(canonical);
    }
  });

  // 4. Fuzzy Matching (Typo Tolerance)
  const rawTokens = lowerText.split(/[\s.,;()/-]+/);
  
  rawTokens.forEach(token => {
    if (token.length > 3) {
      if (!explicitSkills.has(token) && !normalizedSkills.has(normalizeSkill(token))) {
        
        let bestMatch = null;
        let highestScore = 0;

        Array.from(allKnownPhrases).forEach(knownSkill => {
          if (!knownSkill.includes(' ')) {
            const score = natural.JaroWinklerDistance(token, knownSkill);
            if (score > highestScore) {
              highestScore = score;
              bestMatch = knownSkill;
            }
          }
        });

        if (highestScore > 0.92 && bestMatch) {
          explicitSkills.add(token);
          normalizedSkills.add(normalizeSkill(bestMatch));
        }
      }
    }
  });

  const normalizedArr = Array.from(normalizedSkills);
  const expandedArr = expandMacroSkills(normalizedArr);

  // 5. Extract Domains
  const domains = getDomainsForSkills(expandedArr);

  return {
    explicitSkills: Array.from(explicitSkills),
    normalizedSkills: normalizedArr,
    expandedSkills: expandedArr,
    domains
  };
}

module.exports = {
  extractSections,
  extractTechnicalEntities
};

