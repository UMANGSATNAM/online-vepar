const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('k:\\New folder (2)\\online vepar\\src');
let foundErrors = false;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // Find all useCallback or async function declarations
  const decls = {};
  lines.forEach((line, i) => {
    const match = line.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*(useCallback|async)/);
    if (match) {
      decls[match[1]] = i;
    }
  });
  
  // Find all useEffect dependencies
  lines.forEach((line, i) => {
    const match = line.match(/\}, \[(.*?)\]\)/);
    if (match) {
      const deps = match[1].split(',').map(d => d.trim());
      deps.forEach(dep => {
        if (decls[dep] && decls[dep] > i) {
          console.log(`ERROR in ${file}: ${dep} is used on line ${i+1} but declared on line ${decls[dep]+1}`);
          foundErrors = true;
        }
      });
    }
  });
});

if (!foundErrors) console.log('No TDZ reference errors found!');
