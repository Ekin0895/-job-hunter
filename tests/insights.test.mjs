import test from 'node:test';
import assert from 'node:assert/strict';
import {insights} from '../work/insights.mjs';
test('status chart deduplicates history and keeps the latest prepared status',()=>{
 const data={jobs:[{id:'a',status:'Candidature envoyée',cv:'cv',letter:'letter'},{id:'b',status:'À vérifier'}],history:[{id:'a',status:'À analyser'},{id:'c',status:'Entretien final'},{id:'d',status:'Nouveau statut'}]};
 const before=JSON.stringify(data),r=insights(data);
 assert.equal(r.total,4);assert.equal(r.buckets.find(b=>b.key==='sent').count,1);assert.equal(r.buckets.find(b=>b.key==='interview').count,1);assert.equal(r.buckets.find(b=>b.key==='other').count,1);assert.equal(r.buckets.reduce((n,b)=>n+b.count,0),4);assert.equal(JSON.stringify(data),before);
});
test('document chart only counts links in the prepared selection, not unaudited history',()=>{
 const r=insights({jobs:[{id:'a',cv:'cv',letter:'letter'},{id:'b',cv:'cv'},{id:'c'}],history:[{id:'d'},{id:'e'}]});
 assert.equal(r.preparedTotal,3);assert.deepEqual(r.documents.map(b=>b.count),[1,1,1]);assert.equal(r.total,5);
});
test('empty data yields no fake progress or fabricated counts',()=>{
 const r=insights({jobs:[],history:[]});assert.equal(r.total,0);assert.equal(r.buckets.length,0);assert.equal(r.preparedTotal,0);assert.deepEqual(r.documents.map(b=>b.count),[0,0,0]);
});
