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
const suggestedCv=vm.runInNewContext('('+code.match(/function suggestedCv\(j\)\{[\s\S]*?\n\}/)[0]+')');
const marketingCv=suggestedCv({category:'Marketing',company:'Example',role:'SEO',requirements:'SEO technique'});
const commercialCv=suggestedCv({category:'Commercial',company:'Example',role:'BDR'});
const adminCv=suggestedCv({category:'Admin / polyvalent',company:'Example',role:'Assistant'});
assert.match(marketingCv,/72 briefs SEO et 108 optimisations/);
assert.match(commercialCv,/15 rendez-vous hebdomadaires/);
assert.match(adminCv,/G20 — Employé polyvalent \(CDD\)/);
assert.match(adminCv,/Tenue de caisse, mise en rayon/);
assert.doesNotMatch(marketingCv,/augmentation de chiffre d'affaires de \d+%/i);
const suggestedLetter=vm.runInNewContext('('+code.match(/function suggestedLetter\(j\)\{[\s\S]*?\n\}/)[0]+')');
assert.match(suggestedLetter({category:'Marketing',company:'Example',role:'SEO',requirements:'SEO technique'}),/SEO technique/);
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
console.log('PASS: syntax, cloud safeguards/migration, URL/title normalization, factual CV/letter drafts and PWA asset paths.');
console.log('NOT TESTED: browser rendering, live Supabase concurrency/authentication, Google Docs rendering and PDF pagination.');
