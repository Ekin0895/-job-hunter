#!/usr/bin/env node
// Run: node tests/smoke.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
assert.ok(scripts.length,'Application must have an inline script');
for(const script of scripts)new vm.Script(script,{filename:'index.html'});
const code=scripts.join('\n');
for(const [label,pattern] of [
 ['Duplicate offer detection',/function canonicalOfferUrl/],
 ['Normalized company and title',/function normalizedOfferText/],
 ['Conflict backup',/jh-conflict-backup-/],
 ['In-flight pull protection',/if\(cloudPending\|\|\$\('editor'\)\.open/],
 ['Immutable cloud snapshots',/structuredClone\(r\.data\)/],
 ['Atomic cloud save RPC',/\/rest\/v1\/rpc\/job_hunter_save/],
 ['Atomic cloud delete RPC',/\/rest\/v1\/rpc\/job_hunter_delete/],
 ['Version tracking',/cloudRowsToVersions/],
 ['Version-checked delete',/p_expected_updated_at:expected/],
 ['Cover letter draft',/function suggestedLetter/],
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
console.log('PASS: syntax, feature presence and URL/title normalization.');
console.log('NOT TESTED: browser rendering, cloud concurrency, authentication, Google Docs layout, PDF pagination.');
