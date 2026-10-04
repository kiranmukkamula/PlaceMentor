const { cosineSimilarity } = require('./similarity');
const { domainOntology } = require('../nlp/ontology');

/**
 * Calibrates raw cosine similarity values (typically 0.30 - 0.85 for all-MiniLM)
 * into a realistic 0% - 100% scale.
 */
function calibrateSimilarity(rawSim, minFloor = 0.35, maxCeil = 0.85) {
  if (!rawSim || isNaN(rawSim)) return 0;
  if (rawSim <= minFloor) return 0;
  if (rawSim >= maxCeil) return 100;
  return ((rawSim - minFloor) / (maxCeil - minFloor)) * 100;
}

/**
 * Categorizes a list of normalized skills into domain categories (Backend, Frontend, etc.)
 */
function categorizeSkills(skills = []) {
  const categorized = {};
  const uncategorized = [];

  const domainLabels = {
    backend: 'Backend Development',
    frontend: 'Frontend Development',
    database: 'Databases & Storage',
    devops: 'DevOps & CI/CD',
    cloud: 'Cloud Computing',
    data_science: 'AI / Data Science',
    mobile: 'Mobile Development',
    dsa: 'Data Structures & Algorithms',
    cybersecurity: 'Cybersecurity'
  };

  skills.forEach(skill => {
    let matched = false;
    for (const [domainKey, domainSkills] of Object.entries(domainOntology)) {
      if (domainSkills.includes(skill)) {
        const label = domainLabels[domainKey] || domainKey.toUpperCase();
        if (!categorized[label]) categorized[label] = [];
        if (!categorized[label].includes(skill)) {
          categorized[label].push(skill);
        }
        matched = true;
      }
    }
    if (!matched) {
      uncategorized.push(skill);
    }
  });

  if (uncategorized.length > 0) {
    categorized['Other Skills'] = uncategorized;
  }

  return categorized;
}

/**
 * Calculates the final candidate score and provides detailed section-by-section breakdown.
 */
function calculateFinalScore(
  jdEmbeddings, 
  resumeEmbeddings, 
  jdEntities, 
  resumeEntities, 
  resumeSections = {}
) {
  // 1. Calibrated Semantic & Domain Score (40%)
  const rawOverallSim = cosineSimilarity(jdEmbeddings.semantic, resumeEmbeddings.semantic);
  const rawDomainSim = cosineSimilarity(jdEmbeddings.domain, resumeEmbeddings.domain);
  
  const calibratedOverall = calibrateSimilarity(rawOverallSim, 0.38, 0.85);
  const calibratedDomain = calibrateSimilarity(rawDomainSim, 0.32, 0.80);

  // Blended semantic score
  const blendedSemanticScore = (calibratedOverall * 0.45) + (calibratedDomain * 0.55);

  // 2. Normalized & Expanded Skills Matching (25%)
  const { expandMacroSkills } = require('../nlp/ontology');
  
  const jdRawSkills = jdEntities.normalizedSkills || [];
  const jdExpandedSkills = jdEntities.expandedSkills || expandMacroSkills(jdRawSkills);

  const candidateRawSkills = resumeEntities.normalizedSkills || [];
  const candidateExpandedSkills = resumeEntities.expandedSkills || expandMacroSkills(candidateRawSkills);
  const candidateSkills = candidateRawSkills;

  const matchedSkillsSet = new Set();
  const missingSkillsSet = new Set();

  // Match direct raw JD skills
  jdRawSkills.forEach(skill => {
    if (candidateRawSkills.includes(skill) || candidateExpandedSkills.includes(skill)) {
      matchedSkillsSet.add(skill);
    } else {
      missingSkillsSet.add(skill);
    }
  });

  // Match expanded skills (macro concepts like "cs fundamentals" or "development skills")
  jdExpandedSkills.forEach(skill => {
    if (candidateExpandedSkills.includes(skill) || candidateRawSkills.includes(skill)) {
      matchedSkillsSet.add(skill);
      missingSkillsSet.delete(skill);
    }
  });

  // If candidate has CS core skills (OS, CN, OOP, DBMS, DSA) and JD asks for CS fundamentals, mark CS fundamentals matched
  if (jdRawSkills.includes('cs fundamentals') || jdExpandedSkills.includes('cs fundamentals')) {
    const hasCsCore = candidateExpandedSkills.some(s => 
      ['operating systems', 'computer networks', 'object oriented programming', 'dbms', 'database', 'data structures and algorithms', 'data structures', 'algorithms'].includes(s)
    );
    if (hasCsCore) {
      matchedSkillsSet.add('cs fundamentals');
      missingSkillsSet.delete('cs fundamentals');
    }
  }

  // If candidate has web/software dev skills and JD asks for Development skills, mark development skills matched
  if (jdRawSkills.includes('development skills') || jdExpandedSkills.includes('development skills')) {
    const hasDevSkills = candidateExpandedSkills.some(s => 
      ['web development', 'javascript', 'reactjs', 'nodejs', 'express', 'python', 'java', 'html', 'css', 'api'].includes(s)
    );
    if (hasDevSkills) {
      matchedSkillsSet.add('development skills');
      missingSkillsSet.delete('development skills');
    }
  }

  const matchedSkills = Array.from(matchedSkillsSet);
  const missingSkills = Array.from(missingSkillsSet);

  // Additional skills candidate possesses that were not in JD
  const additionalSkills = candidateRawSkills.filter(s => !matchedSkillsSet.has(s));

  let skillsScore = 0;
  const totalJdRequirements = Math.max(1, jdRawSkills.length > 0 ? jdRawSkills.length : jdExpandedSkills.length);
  const matchRatio = Math.min(1, matchedSkills.length / totalJdRequirements);
  
  // Add domain-overlap credit: if candidate has domain skills matching JD domain
  const candidateDomains = resumeEntities.domains || [];
  const jdDomains = jdEntities.domains || [];
  const matchedDomainCount = candidateDomains.filter(d => jdDomains.includes(d)).length;
  const domainBonus = jdDomains.length > 0 ? (matchedDomainCount / jdDomains.length) * 15 : 10;

  skillsScore = Math.min(100, Math.round((matchRatio * 85) + domainBonus));


  // 3. Project Relevance (15%)
  const hasProjectsSection = resumeSections.projects && resumeSections.projects.trim().length >= 15;
  const hasExperienceSection = resumeSections.experience && resumeSections.experience.trim().length >= 15;

  let rawProjectSim = cosineSimilarity(jdEmbeddings.semantic, resumeEmbeddings.project);
  let projectScore = 0;

  if (hasProjectsSection) {
    projectScore = calibrateSimilarity(rawProjectSim, 0.30, 0.80);
  } else if (hasExperienceSection) {
    // Fallback: evaluate candidate's experience section similarity if explicit projects section is missing
    projectScore = calibrateSimilarity(rawProjectSim, 0.32, 0.80) * 0.85; // 15% penalty for missing explicit project header
  } else {
    projectScore = Math.max(0, blendedSemanticScore - 30);
  }

  // 4. Certifications Assessment (10%)
  let certScore = 0;
  const certText = resumeSections.certifications || '';
  const certsLower = certText.toLowerCase();
  const certItems = [];

  if (certText.trim().length > 10) {
    certScore = 50; // base score for having certs
    if (certsLower.includes('aws') || certsLower.includes('amazon') || certsLower.includes('azure') || certsLower.includes('gcp') || certsLower.includes('oracle') || certsLower.includes('cisco') || certsLower.includes('redhat')) {
      certScore += 30;
      certItems.push('Cloud/Vendor Technical Certification');
    }
    if (certsLower.includes('nptel') || certsLower.includes('coursera') || certsLower.includes('udemy') || certsLower.includes('edx') || certsLower.includes('google') || certsLower.includes('certified')) {
      certScore += 20;
      certItems.push('Course/Specialization Certificate');
    }
    certScore = Math.min(100, certScore);
  } else {
    // Check if skills list contains any certifications keyword
    certScore = candidateSkills.some(s => ['aws', 'gcp', 'azure'].includes(s)) ? 40 : 0;
  }

  // 5. Achievements & Honors Assessment (10%)
  let achScore = 0;
  const achText = resumeSections.achievements || '';
  const achLower = achText.toLowerCase();
  const achItems = [];

  if (achText.trim().length > 10) {
    achScore = 50;
    if (achLower.includes('hackathon') || achLower.includes('winner') || achLower.includes('1st') || achLower.includes('2nd') || achLower.includes('3rd') || achLower.includes('top')) {
      achScore += 30;
      achItems.push('Hackathon / Competition Award');
    }
    if (achLower.includes('leetcode') || achLower.includes('codeforces') || achLower.includes('codechef') || achLower.includes('kaggle') || achLower.includes('rank') || achLower.includes('rating')) {
      achScore += 20;
      achItems.push('Competitive Programming / Coding Platform Rank');
    }
    achScore = Math.min(100, achScore);
  } else {
    // Check if DSA or competitive programming skill present
    achScore = candidateSkills.some(s => ['dsa', 'data structures and algorithms', 'leetcode'].includes(s)) ? 30 : 0;
  }

  // Calculate Weighted Final Score
  const finalScore = Math.min(100, Math.max(0, (
    (blendedSemanticScore * 0.40) + 
    (skillsScore * 0.25) + 
    (projectScore * 0.15) + 
    (certScore * 0.10) + 
    (achScore * 0.10)
  )));

  // Generate Match Tier & Human Readable Summary
  let matchTier = "Weak Fit";
  if (finalScore >= 80) matchTier = "Exceptional Fit";
  else if (finalScore >= 65) matchTier = "Strong Fit";
  else if (finalScore >= 50) matchTier = "Moderate Fit";

  const summaryParts = [];
  if (matchedSkills.length > 0) {
    summaryParts.push(`Matches ${matchedSkills.length} of ${jdRawSkills.length || 1} required JD skills (${matchedSkills.slice(0, 4).join(', ')})`);
  } else {
    summaryParts.push(`No exact skill overlap with required JD skills`);
  }

  if (resumeEntities.domains && resumeEntities.domains.length > 0) {
    summaryParts.push(`Domain expertise in ${resumeEntities.domains.join(', ')}`);
  }

  // Categorize candidate skills by domain
  const categorizedCandidateSkills = categorizeSkills(candidateSkills);

  // Build Detailed Section Breakdown Object
  const sectionBreakdown = {
    skills: {
      hasContent: Boolean(resumeSections.skills && resumeSections.skills.trim()),
      preview: resumeSections.skills ? resumeSections.skills.trim().substring(0, 180) + '...' : 'No dedicated skills header found',
      allExtractedSkills: candidateSkills,
      categorizedSkills: categorizedCandidateSkills
    },
    projects: {
      hasContent: hasProjectsSection,
      score: Math.round(projectScore),
      preview: resumeSections.projects ? resumeSections.projects.trim().substring(0, 220) + '...' : (hasExperienceSection ? 'Evaluated from Experience section fallback' : 'No projects section detected')
    },
    experience: {
      hasContent: hasExperienceSection,
      preview: resumeSections.experience ? resumeSections.experience.trim().substring(0, 220) + '...' : 'No professional experience listed'
    },
    certifications: {
      hasContent: Boolean(resumeSections.certifications && resumeSections.certifications.trim()),
      score: Math.round(certScore),
      detectedItems: certItems,
      preview: resumeSections.certifications ? resumeSections.certifications.trim().substring(0, 180) + '...' : 'No certifications section detected'
    },
    achievements: {
      hasContent: Boolean(resumeSections.achievements && resumeSections.achievements.trim()),
      score: Math.round(achScore),
      detectedItems: achItems,
      preview: resumeSections.achievements ? resumeSections.achievements.trim().substring(0, 180) + '...' : 'No achievements section detected'
    }
  };

  const explanations = {
    matchTier,
    summaryText: summaryParts.join('. ') + '.',
    matchedDomains: resumeEntities.domains.filter(d => (jdEntities.domains || []).includes(d)),
    rejectedDomains: resumeEntities.domains.filter(d => !(jdEntities.domains || []).includes(d)),
    matchedSkills,
    missingSkills,
    additionalSkills,
    categorizedCandidateSkills,
    sections: sectionBreakdown
  };

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
  calculateFinalScore,
  categorizeSkills,
  calibrateSimilarity
};

