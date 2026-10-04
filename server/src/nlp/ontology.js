/**
 * Dictionary for normalizing technical skill variants into a single canonical form.
 * Solves: k8s -> kubernetes, js -> javascript, node -> nodejs, oops -> object oriented programming
 */
const skillNormalization = {
  // CS Fundamentals & Core Concepts
  'os': 'operating systems',
  'operating system': 'operating systems',
  'cn': 'computer networks',
  'networking': 'computer networks',
  'computer network': 'computer networks',
  'oop': 'object oriented programming',
  'oops': 'object oriented programming',
  'object oriented': 'object oriented programming',
  'dbms': 'dbms',
  'rdbms': 'dbms',
  'cs fundamentals': 'cs fundamentals',
  'computer science fundamentals': 'cs fundamentals',
  'cs core': 'cs fundamentals',
  'core cs': 'cs fundamentals',
  'development skills': 'development skills',
  'software development': 'development skills',
  'web development': 'web development',
  'dev skills': 'development skills',
  'dev': 'development skills',
  'system design': 'system design',
  
  // Languages
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'cpp': 'c++',
  'c#': 'csharp',
  'go': 'golang',
  
  // Frameworks/Libraries
  'node': 'nodejs',
  'react': 'reactjs',
  'react.js': 'reactjs',
  'vue': 'vuejs',
  'vue.js': 'vuejs',
  'next': 'nextjs',
  'next.js': 'nextjs',
  'nest': 'nestjs',
  'nest.js': 'nestjs',
  'angular2': 'angular',
  'k8s': 'kubernetes',
  'aws': 'amazon web services',
  'gcp': 'google cloud',
  'azure': 'microsoft azure',
  'mongo': 'mongodb',
  'postgres': 'postgresql',
  'db': 'database',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'nlp': 'natural language processing',
  'cv': 'computer vision',
  'dl': 'deep learning',
  'rl': 'reinforcement learning',
  'dsa': 'data structures and algorithms',
  'ds': 'data science',
  'rn': 'react native',
  'tf': 'tensorflow'
};

/**
 * Macro concepts mapping to their constituent micro-skills.
 * Allows JD requirements like "CS Fundamentals" or "Development Skills" to map to actual candidate skills.
 */
const conceptExpansion = {
  'cs fundamentals': [
    'operating systems', 
    'computer networks', 
    'object oriented programming', 
    'dbms', 
    'database', 
    'data structures and algorithms', 
    'data structures', 
    'algorithms',
    'system design'
  ],
  'development skills': [
    'web development', 
    'javascript', 
    'reactjs', 
    'nodejs', 
    'express', 
    'python', 
    'java', 
    'html', 
    'css', 
    'api', 
    'database', 
    'sql', 
    'git'
  ],
  'web development': [
    'javascript', 
    'reactjs', 
    'nodejs', 
    'express', 
    'html', 
    'css', 
    'api', 
    'tailwind'
  ],
  'full stack': [
    'javascript', 
    'reactjs', 
    'nodejs', 
    'express', 
    'mongodb', 
    'postgresql', 
    'html', 
    'css', 
    'api', 
    'database'
  ]
};

/**
 * Maps canonical skills to broader technical domains for context-aware matching.
 */
const domainOntology = {
  cs_fundamentals: [
    'operating systems', 'computer networks', 'object oriented programming',
    'dbms', 'data structures and algorithms', 'data structures', 'algorithms',
    'system design', 'cs fundamentals', 'leetcode', 'codeforces'
  ],
  development: [
    'development skills', 'web development', 'javascript', 'typescript', 'reactjs',
    'nodejs', 'express', 'python', 'java', 'html', 'css', 'api', 'full stack'
  ],
  backend: [
    'nodejs', 'express', 'python', 'django', 'flask', 'fastapi',
    'java', 'spring', 'springboot', 'csharp', 'dotnet', 'golang',
    'php', 'laravel', 'ruby', 'rails', 'nestjs', 'api', 'rest', 'graphql'
  ],
  frontend: [
    'javascript', 'typescript', 'reactjs', 'vuejs', 'angular',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'nextjs',
    'redux', 'webpack', 'babel', 'ui', 'ux'
  ],
  database: [
    'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite',
    'oracle', 'sql server', 'cassandra', 'dynamodb', 'elasticsearch', 'sql', 'nosql', 'dbms', 'database'
  ],
  devops: [
    'docker', 'kubernetes', 'jenkins', 'github actions', 'gitlab ci',
    'terraform', 'ansible', 'nginx', 'apache', 'linux', 'bash', 'shell'
  ],
  cloud: [
    'amazon web services', 'google cloud', 'microsoft azure', 'ec2', 's3',
    'lambda', 'serverless', 'firebase', 'heroku', 'digitalocean'
  ],
  data_science: [
    'python', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
    'keras', 'matplotlib', 'seaborn', 'jupyter', 'machine learning',
    'deep learning', 'artificial intelligence', 'data science', 'statistics', 'nlp'
  ],
  mobile: [
    'react native', 'flutter', 'dart', 'swift', 'ios',
    'kotlin', 'android', 'java'
  ],
  dsa: [
    'data structures', 'algorithms', 'graphs', 'dynamic programming',
    'competitive programming', 'leetcode', 'trees', 'data structures and algorithms'
  ],
  cybersecurity: [
    'penetration testing', 'kali linux', 'wireshark', 'metasploit', 'cryptography',
    'owasp', 'security', 'firewalls'
  ]
};

/**
 * Normalizes a raw skill string to its canonical form if it exists.
 */
function normalizeSkill(rawSkill) {
  const lower = rawSkill.toLowerCase().trim();
  return skillNormalization[lower] || lower;
}

/**
 * Expands a set of normalized skills using macro concept definitions.
 * E.g. "cs fundamentals" -> adds ["operating systems", "computer networks", "object oriented programming", "dbms", "dsa"]
 */
function expandMacroSkills(skills = []) {
  const expanded = new Set(skills);
  skills.forEach(skill => {
    const canonical = normalizeSkill(skill);
    if (conceptExpansion[canonical]) {
      conceptExpansion[canonical].forEach(microSkill => expanded.add(microSkill));
    }
  });
  return Array.from(expanded);
}

/**
 * Classifies an array of canonical skills into domains.
 * @param {Array<string>} skills 
 * @returns {Array<string>} List of unique matched domains
 */
function getDomainsForSkills(skills) {
  const domains = new Set();
  
  skills.forEach(skill => {
    for (const [domain, domainSkills] of Object.entries(domainOntology)) {
      if (domainSkills.includes(skill)) {
        domains.add(domain);
      }
    }
  });

  return Array.from(domains);
}

module.exports = {
  skillNormalization,
  conceptExpansion,
  domainOntology,
  normalizeSkill,
  expandMacroSkills,
  getDomainsForSkills
};