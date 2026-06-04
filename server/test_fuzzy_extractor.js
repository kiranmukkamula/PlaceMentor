const { extractTechnicalEntities } = require('./src/nlp/extractor');

const cvText = "numspy,pands,javascipt,reacjts";
console.log(extractTechnicalEntities(cvText));
