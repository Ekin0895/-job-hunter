// Native Docs JSON + pdftotext -bbox output are both required for a complete CV check.
// Usage: node scripts/check-cv-format.mjs document.json tab-id rendered-pdf.html
import {readFileSync} from 'node:fs';
import {reviewCv} from './cv-review.mjs';
const [file,tab,bbox]=process.argv.slice(2);
if(!file||!tab){console.error('Usage: node scripts/check-cv-format.mjs document.json tab-id rendered-pdf.html');process.exit(2)}
const result=reviewCv(JSON.parse(readFileSync(file,'utf8')),tab,bbox?readFileSync(bbox,'utf8'):undefined);
console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
