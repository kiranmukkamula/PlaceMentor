const natural = require('natural');

const w1 = "numspy";
const w2 = "numpy";
console.log(`JaroWinklerDistance(${w1}, ${w2}) =`, natural.JaroWinklerDistance(w1, w2));

const w3 = "pands";
const w4 = "pandas";
console.log(`JaroWinklerDistance(${w3}, ${w4}) =`, natural.JaroWinklerDistance(w3, w4));

const w5 = "javascipt";
const w6 = "javascript";
console.log(`JaroWinklerDistance(${w5}, ${w6}) =`, natural.JaroWinklerDistance(w5, w6));
