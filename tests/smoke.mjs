#!/usr/bin/env node
// Run: node tests/smoke.mjs
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
assert.ok(scripts.length,'Application must have an inline script');
for(const script of scripts)new vm.Script(script,{filename:'index.html'});
const code=scripts.join('\n');
for(const [label,pattern] of [
 ['Duplicate offer detection',/function canonicalOfferUrl/],
 ['Normalized company and title',/function normalizedOfferText/],
 ['Cloud refresh backup',/jh-before-refresh-/],
 ['In-flight pull protection',/if\(cloudPending\|\|\$\('editor'\)\.open/],
 ['Immutable cloud snapshots',/structuredClone\(r\.data\)/],
 ['Atomic cloud save RPC',/\/rest\/v1\/rpc\/job_hunter_save/],
 ['Atomic cloud delete RPC',/\/rest\/v1\/rpc\/job_hunter_delete/],
 ['Version tracking',/cloudRowsToVersions/],
 ['Version-checked delete',/p_expected_updated_at:expected/],
 ['Unsynced edits recovery',/jh-cloud-last-/],
 ['Refresh backup',/jh-before-refresh-/],
 ['Remote recovery conflict detection',/const conflicts=\[\.\.\.changedIds\]/],
 ['Recovery preserves independent remote edits',/const merged=new Map\(\[\.\.\.remote\]/],
 ['Recovery reapplies only locally changed jobs',/for\(const id of changedIds\)/],
 ['Order-independent baseline comparison',/function sameJobSet/],
 ['Cover letter draft',/function suggestedLetter/],
 ['Personalized CV draft',/function suggestedCv/],
 ['CV editor and saved draft',/data-cv|cvText/],
 ['Google Docs template copy links',/docs\.google\.com\/document\/d\/[^' ]+\/copy/],
 ['Offer description and requirements',/\['description','Description de l’annonce'/],
 ['Manual CV verification',/cvChecked/],
 ['Manual letter verification',/letterChecked/],
 ['Known wrong Klox link warning',/mismatchedKlox/],
])assert.match(code,pattern,label);

const helpers=code.slice(code.indexOf('function canonicalOfferUrl'),code.indexOf("$('jobform').onsubmit"));
const context=vm.createContext({URL,console});
vm.runInContext(helpers,context);
assert.equal(vm.runInContext("canonicalOfferUrl('https://example.com/jobs/123/?utm_source=x&trk=y')",context),'https://example.com/jobs/123');
assert.equal(vm.runInContext("canonicalOfferUrl('javascript:alert(1)')",context),'');
assert.equal(vm.runInContext("normalizedOfferText('Chef de Projet SEO/GÉO')===normalizedOfferText('chef de projet seo geo')",context),true);
const sameJobSet=vm.runInNewContext('('+code.match(/function sameJobSet\(a,b\)\{[\s\S]*?\n\}/)[0]+')');
assert.equal(sameJobSet([{id:'a',company:'A'},{id:'b',company:'B'}],[{id:'b',company:'B'},{id:'a',company:'A'}]),true);
assert.equal(sameJobSet([{id:'a',company:'A'}],[{id:'a',company:'Changed'}]),false);
const draftsContext=vm.createContext({console});
vm.runInContext(code.match(/function cvTailoring\(j\)\{[\s\S]*?\n\}/)[0]+'\n'+code.match(/function suggestedCv\(j\)\{[\s\S]*?\n\}/)[0]+'\n'+code.match(/function suggestedLetter\(j\)\{[\s\S]*?\n\}/)[0],draftsContext);
const suggestedCv=j=>vm.runInContext('suggestedCv('+JSON.stringify(j)+')',draftsContext);
const suggestedLetter=j=>vm.runInContext('suggestedLetter('+JSON.stringify(j)+')',draftsContext);
const marketingCv=suggestedCv({category:'Marketing',company:'Example',role:'SEO',requirements:'SEO technique'});
const commercialCv=suggestedCv({category:'Commercial',company:'Example',role:'BDR'});
const adminCv=suggestedCv({category:'Admin / polyvalent',company:'Example',role:'Assistant'});
assert.match(marketingCv,/72 briefs SEO et 108 optimisations/);
assert.match(commercialCv,/15 rendez-vous hebdomadaires/);
assert.match(adminCv,/G20 — Employé polyvalent \| Janv\. 2019/);
assert.match(adminCv,/Tenue de caisse, mise en rayon/);
assert.doesNotMatch(marketingCv,/augmentation de chiffre d'affaires de \d+%/i);
assert.match(suggestedLetter({category:'Marketing',company:'Example',role:'SEO',requirements:'SEO technique'}),/SEO/);
assert.match(suggestedLetter({category:'Marketing',company:'Example',role:'SEO'}),/72 briefs SEO et à 108 optimisations/);
assert.equal(readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('<title>Job Hunter — V10</title>'),true);
const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
for(const icon of manifest.icons)assert.ok(existsSync(new URL('../'+icon.src,import.meta.url)),`Missing PWA icon ${icon.src}`);
assert.match(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/jh-v10-dev-shell-2/);
const saveSql=readFileSync(new URL('../supabase/job_hunter_save.sql',import.meta.url),'utf8');
assert.match(saveSql,/pg_advisory_xact_lock/);
assert.match(saveSql,/CONFLIT_SYNCHRONISATION/);
assert.match(saveSql,/v_existing_updated_at \+ interval '1 microsecond'/);
assert.match(saveSql,/ENABLE ROW LEVEL SECURITY/);
assert.match(saveSql,/zzz_v10_job_hunter_monotonic_updated_at/);
assert.match(code,/if\(!v\.cv&&!v\.pdf&&!v\.cvText\)v\.cvChecked='Non'/);
assert.match(code,/function cvReviewIssues/);
assert.match(code,/function cvMarkup/);
assert.match(code,/function printCvDocument/);
assert.match(code,/keys\.slice\(8\)/);
assert.match(marketingCv,/Janv\. 2024 – sept\. 2025/);
assert.match(marketingCv,/SEMrush/);
assert.doesNotMatch(marketingCv,/À VÉRIFIER AVANT ENVOI/);
const reviewIssues=vm.runInNewContext('('+code.match(/function cvReviewIssues\(text\)\{[\s\S]*?\n\}/)[0]+')');
assert.ok(reviewIssues('Dates à confirmer').length>0);
assert.equal(reviewIssues('A'.repeat(500)).length,0);
const cvMarkup=vm.runInNewContext('('+code.match(/function cvMarkup\(text\)\{[\s\S]*?\n\}/)[0]+')',{safe:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')});
assert.match(cvMarkup('EKIN IKIZER\nConsultant SEO\nPROFIL\nTexte'),/cv-section/);
assert.match(cvMarkup('EKIN IKIZER\nConsultant SEO\nPROFIL\n<script>'),/&lt;script>/);
assert.match(marketingCv,/CONSULTANT SEO/i);
assert.match(suggestedLetter({category:'Marketing',company:'Example',role:'Growth Marketing',requirements:'Meta Ads'}),/huit campagnes Meta Ads/);
assert.match(suggestedLetter({category:'Commercial',company:'Example',role:'Business Developer'}),/15 rendez-vous par semaine/);
assert.match(code,/function printDocument/);
assert.match(html,/id="v10-mobile-polish"/);
assert.match(html,/id="cvPreview"/);
assert.match(html,/id="cvChecks"/);
assert.match(code,/function cvReviewIssues/);
// Execute cloud replacement with an isolated localStorage mock.
const cloudFunctions=[
 code.match(/function cloudRowsToMap[^\n]*/)?.[0],
 code.match(/function cloudRowsToVersions[^\n]*/)?.[0],
 code.match(/function sameJobSet\(a,b\)\{[\s\S]*?\n\}/)?.[0],
 code.match(/function cloudReplace\(rows\)\{[\s\S]*?\n\}/)?.[0]
];
assert.ok(cloudFunctions.every(Boolean),'Cloud replacement helpers must be extractable');
const storageMap=new Map();
let blocked=false,renderCount=0,quotaFull=false;
const storage={
 getItem:key=>storageMap.get(key)??null,
 setItem:(key,value)=>{if(quotaFull)throw new Error('QuotaExceededError');storageMap.set(key,value)},
 removeItem:key=>storageMap.delete(key),
 key:index=>[...storageMap.keys()][index],
 get length(){return storageMap.size}
};
const cloudSandbox=vm.createContext({localStorage:storage,KEY:'jobs',structuredClone,cloudMessage:()=>{blocked=true},render:()=>{renderCount++}});
vm.runInContext('let jobs=[{id:"a",company:"A"}],cloudUser={id:"user"},cloudSnapshot=new Map(),cloudVersions=new Map();'+cloudFunctions.join('\n'),cloudSandbox);
const cloudRows=(company,version)=>[{local_id:'a',data:{id:'a',company},updated_at:version}];
assert.equal(vm.runInContext('cloudReplace('+JSON.stringify(cloudRows('A','1'))+')',cloudSandbox),true);
assert.equal(storageMap.size,1,'Unchanged cloud refresh must not create a backup');
assert.equal(vm.runInContext('cloudReplace('+JSON.stringify(cloudRows('B','2'))+')',cloudSandbox),true);
assert.equal(renderCount,1);
assert.equal([...storageMap.keys()].filter(k=>k.startsWith('jh-before-refresh-')).length,1);
quotaFull=true;
assert.equal(vm.runInContext('cloudReplace('+JSON.stringify(cloudRows('C','3'))+')',cloudSandbox),false);
assert.equal(vm.runInContext('jobs[0].company',cloudSandbox),'B','Failed cloud write must not overwrite in-memory jobs');
assert.equal(blocked,true);

console.log('PASS: syntax, cloud safeguards/migration, URL/title normalization, factual CV/letter drafts and PWA asset paths.');
console.log('NOT TESTED: browser rendering, live Supabase concurrency/authentication, Google Docs rendering and PDF pagination.');
