const { extractTechnicalEntities } = require('./server/src/nlp/extractor');

const jd = "Looking for data science roles using numpy, pandas.";
const cv = "skills section: numpy,pandas";

const jdEntities = extractTechnicalEntities(jd);
const cvEntities = extractTechnicalEntities(cv);

console.log("JD Entities:", jdEntities);
console.log("CV Entities:", cvEntities);
