const fs = require('fs');
const path = require('path');

function findInDir(dir, pattern) {
    let results = [];
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') {
                    results = results.concat(findInDir(fullPath, pattern));
                }
            } else {
                if (fullPath.endsWith('.js')) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes(pattern)) {
                        results.push(fullPath);
                    }
                }
            }
        }
    } catch (e) {}
    return results;
}

const root = 'C:\\DBMS\\Main Project';
const pattern = 'app.listen(5000)';
console.log('Results:', findInDir(root, pattern));
