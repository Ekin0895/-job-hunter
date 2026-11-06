// Validate bold labels in a Google Docs API documents.get response (includeTabsContent=true).
// Usage: node scripts/check-cv-format.mjs exported-google-docs-response.json [tab-id]
import {readFileSync} from 'node:fs';
const file=process.argv[2], tabId=process.argv[3];
if(!file){console.error('Usage: node scripts/check-cv-format.mjs document.json [tab-id]');process.exit(2)}
const doc=JSON.parse(readFileSync(file,'utf8'));
const tabs=(doc.tabs||[]).flatMap(function walk(t){return [t,...(t.childTabs||[]).flatMap(walk)]});
const selected=tabId?tabs.filter(t=>(t.tabProperties?.tabId||t.tabId)===tabId):tabs;
if(!selected.length){console.error('No matching tab');process.exit(2)}
let checked=0,failures=[];
for(const tab of selected){const title=tab.tabProperties?.title||tab.title||'Untitled';for(const p of (tab.documentTab?.body?.content||tab.body?.content||[])){
 const els=p.paragraph?.elements||[];const line=els.map(e=>e.textRun?.content||'').join('');const colon=line.indexOf(':');
 if(colon<1||colon>35)continue;checked++;let offset=0;
 for(const e of els){const run=e.textRun;if(!run)continue;for(let i=0;i<run.content.length;i++){
 const c=run.content[i],position=offset+i;if(c==='\\n'||c===' ')continue;
 const shouldBold=position<=colon;if(Boolean(run.textStyle?.bold)!==shouldBold){failures.push({tab:title,line:line.trim(),position,expected:shouldBold?'bold':'normal'});break}
 }offset+=run.content.length}
}}
console.log(JSON.stringify({checked,failures},null,2));if(failures.length)process.exitCode=1;
