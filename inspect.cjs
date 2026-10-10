const fs = require('fs');
const shell = fs.readFileSync('shell.js', 'utf8');

// find where a() creates the URL
const aIdx = shell.indexOf('function a(');
if (aIdx !== -1) {
  console.log('function a:', shell.substring(aIdx, aIdx + 500));
}

// find occurrences of /_
const rpcMatches = [...shell.matchAll(/\/[a-zA-Z0-9_\-\/]+/g)].map(m => m[0]);
console.log('Paths with /:', [...new Set(rpcMatches.filter(p => p.includes('server') || p.includes('api') || p.includes('rpc') || p.length > 5))]);
