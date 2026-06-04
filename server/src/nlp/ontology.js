/**
 * Dictionary for normalizing technical skill variants into a single canonical form.
 * Solves: k8s -> kubernetes, js -> javascript, node -> nodejs
 */
const skillNormalization = {
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
 * Maps canonical skills to broader technical domains for context-aware matching.
 * This ensures that a backend requirement matches a backend skill set.
 */
const domainOntology = {
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
    'oracle', 'sql server', 'cassandra', 'dynamodb', 'elasticsearch', 'sql', 'nosql'
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
  domainOntology,
  normalizeSkill,
  getDomainsForSkills
};
