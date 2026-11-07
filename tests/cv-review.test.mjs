import test from 'node:test';import assert from 'node:assert/strict';import {reviewCv} from '../scripts/cv-review.mjs';
const footer='Ville (95000)   candidat@example.com   06 00 00 00 00   linkedin.com/in/candidat\n';
const doc=()=>({tabs:[{tabId:'cv',body:{content:[{paragraph:{elements:[{textRun:{content:'SEO :',textStyle:{bold:true}}},{textRun:{content:' Une mission réelle.\n',textStyle:{bold:false}}}]}}]},footers:{f:{content:[{paragraph:{elements:[{textRun:{content:footer}}]}}]}}}]});
const html=(wrap=false)=>'<page width="596" height="842">'+footer.trim().split(/\s+/).map((t,i)=>'<word yMin="'+(wrap&&i===8?824:812)+'" xMin="90">'+t+'</word>').join('')+'</page>';
test('full review needs bold proof and a visible one-line A4 footer',()=>{assert.equal(reviewCv(doc(),'cv',html()).passed,true);assert.equal(reviewCv(doc(),'cv').passed,false)});
test('a wrapped footer fails even when the native text has no newline',()=>{assert.match(reviewCv(doc(),'cv',html(true)).footer.failures.join(' '),/plusieurs lignes/)});
test('missing contact details or all-bold descriptions cannot be approved',()=>{let d=doc();d.tabs[0].footers={};assert.equal(reviewCv(d,'cv',html()).passed,false);d=doc();d.tabs[0].body.content[0].paragraph.elements[1].textRun.textStyle.bold=true;assert.equal(reviewCv(d,'cv',html()).passed,false)});
