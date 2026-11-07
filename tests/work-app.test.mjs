import test from 'node:test';
import assert from 'node:assert/strict';
import {HEADERS,cellUrl,safeUrl,sheetId,parseWorkbook,summarize,statusPlan,saveStatus,googleRequest} from '../work/data.mjs';
const cell=v=>({formattedValue:String(v),userEnteredValue:{stringValue:String(v)}});
function fixture(){
 const row=Array.from({length:30},()=>cell(''));
 for(const [i,v]of [[0,'Entreprise Test'],[1,'Consultant SEO'],[2,'À vérifier'],[6,81],[15,'JH-0001'],[20,'1 page A4 vérifiée'],[21,'Lettre relue'],[27,'https://example.com/jobs/1']])row[i]=cell(v);
 row[4]={formattedValue:'Ouvrir CV',hyperlink:'https://docs.google.com/document/d/test-cv/edit'};
 row[5]={formattedValue:'Ouvrir lettre',textFormatRuns:[{startIndex:0,format:{link:{uri:'https://docs.google.com/document/d/test-letter/edit'}}}]};
 const old=Array.from({length:15},()=>cell(''));for(const [i,v]of [[0,1],[1,'Prête'],[3,'Entreprise Test'],[4,'Consultant SEO']])old[i]=cell(v);
 return {sheets:[{properties:{sheetId:11001,title:'Candidatures'},data:[{startRow:0,rowData:[{values:HEADERS.map(cell)},{values:row}]}]},{properties:{title:'Suivi'},data:[{startRow:8,rowData:[{values:old}]}]}]};
}
test('URLs reject executable links and credentials, document links stay on Google Docs',()=>{
 assert.equal(safeUrl('javascript:alert(1)'), '');assert.equal(safeUrl('https://user:pw@example.com'), '');
 assert.equal(safeUrl('https://evil.example/document/d/id',true),'');
 assert.equal(sheetId('https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuvwxyz/edit'),'abcdefghijklmnopqrstuvwxyz');
 assert.equal(sheetId('https://evil.example/spreadsheets/d/abcdefghijklmnopqrstuvwxyz/edit'),'');
});
test('reads real hyperlink fields instead of display labels, preserves row identity',()=>{
 const data=parseWorkbook(fixture());assert.equal(data.jobs[0].cv,'https://docs.google.com/document/d/test-cv/edit');
 assert.equal(data.jobs[0].letter,'https://docs.google.com/document/d/test-letter/edit');
 assert.equal(data.jobs[0].rowIndex,1);assert.equal(data.history[0].id,'JH-0001');
 assert.equal(data.history[0].status,'À analyser');assert.equal(data.history[0].editable,false);
 assert.equal(summarize(data).review,1);assert.equal(summarize(data).ready,0);
});
test('schema changes and duplicate IDs block writes instead of shifting columns',()=>{
 const bad=fixture();bad.sheets[0].data[0].rowData[0].values[0]=cell('Autre');assert.throws(()=>parseWorkbook(bad));
 const dup=fixture();dup.sheets[0].data[0].rowData.push(dup.sheets[0].data[0].rowData[1]);assert.throws(()=>parseWorkbook(dup));
});
test('status write targets only the current row status and requires evidence for ready',()=>{
 const fresh=parseWorkbook(fixture()),previous=fresh.jobs[0];const plan=statusPlan(fresh,previous,'Prêt à postuler');
 const write=plan.requests[0].updateCells;assert.equal(write.range.startColumnIndex,2);assert.equal(write.range.endColumnIndex,3);assert.equal(write.range.startRowIndex,1);
 assert.throws(()=>statusPlan(fresh,{...previous,status:'À analyser'},'Refus'));
 fresh.jobs[0].cvCheck='Pagination non vérifiée';assert.throws(()=>statusPlan(fresh,previous,'Prêt à postuler'));fresh.jobs[0].cvCheck='1 page A4 inspectée';
 fresh.jobs[0].cv='';assert.throws(()=>statusPlan(fresh,previous,'Prêt à postuler'));
 assert.throws(()=>statusPlan(fresh,{...previous,editable:false},'Refus'));
});
test('write is never automatically replayed, and success requires readback',async()=>{
 let calls=0;const initial=fixture();const previous=parseWorkbook(initial).jobs[0];
 const fetcher=async(url,options)=>{calls++;if(calls===1)return {ok:true,json:async()=>initial};if(calls===2){assert.equal(options.method,'POST');throw Error('Connection lost');}throw Error('Unexpected retry')};
 await assert.rejects(saveStatus({id:'abcdefghijklmnopqrstuvwxyz',token:'test-token',previous,next:'Refus',fetcher}),/Connection lost/);
 assert.equal(calls,2);
 let step=0;const verified=fixture();verified.sheets[0].data[0].rowData[1].values[2]=cell('Refus');
 const success=async()=>({ok:true,json:async()=>++step===1?fixture():step===2?{replies:[{}]}:verified});
 const saved=await saveStatus({id:'abcdefghijklmnopqrstuvwxyz',token:'test-token',previous,next:'Refus',fetcher:success});assert.equal(saved.jobs[0].status,'Refus');assert.equal(step,3);
});
test('Google permission and quota errors are explicit failures',async()=>{
 for(const status of [401,403,429])await assert.rejects(googleRequest('https://example.com','x',{fetcher:async()=>({ok:false,status,json:async()=>({})})}));
});

test('Disabled Sheets API is distinguished from file permission refusal',async()=>{
 await assert.rejects(googleRequest('https://example.com','x',{fetcher:async()=>({ok:false,status:403,json:async()=>({error:{message:'Service disabled',details:[{reason:'SERVICE_DISABLED'}]}})})}),/API Google Sheets est désactivée/);
 await assert.rejects(googleRequest('https://example.com','x',{fetcher:async()=>({ok:false,status:403,json:async()=>({error:{message:'The caller does not have permission'}})})}),/caller does not have permission/);
});
