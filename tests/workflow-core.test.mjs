import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalUrl, duplicateOf, eligibility, checkBold, replacementPlan, reviewState} from '../scripts/workflow-core.mjs';
const fixture = {documentId:'copy', revisionId:'r1', tabs:[{tabId:'t.1',body:{content:[{startIndex:1,paragraph:{elements:[
  {textRun:{content:'SEO :',textStyle:{bold:true}}},{textRun:{content:' Contenus.\n',textStyle:{bold:false}}}
]}}]}}]};
test('canonical URL handles LinkedIn slugs, official application links and Indeed IDs', () => {
  assert.equal(canonicalUrl('https://fr.linkedin.com/jobs/view/consultant-seo-at-example-123456/?trk=email'), 'https://www.linkedin.com/jobs/view/123456');
  assert.equal(canonicalUrl('https://careers.example.com/jobs/123/applications/new?promotion=abc'), canonicalUrl('https://careers.example.com/jobs/123/'));
  assert.equal(canonicalUrl('https://fr.indeed.com/viewjob?jk=abc&utm_source=x'), 'https://indeed.com/viewjob?jk=abc');
  assert.equal(canonicalUrl('javascript:alert(1)'), '');
  assert.notEqual(canonicalUrl('https://example.com/jobs?id=1'), canonicalUrl('https://example.com/jobs?id=2'));
});
test('duplicates reuse existing row, distinct known locations remain distinct', () => {
  const old = {id:'existing',company:'Équipe',role:'Chef de projet',location:'Paris',url:'https://a.example/jobs/1'};
  assert.equal(duplicateOf({...old,url:'https://b.example/jobs/2',company:'Equipe'},[old]), old);
  assert.equal(duplicateOf({...old,url:'https://b.example/jobs/2',location:'Lyon'},[old]), undefined);
});
test('criteria reject incompatible facts and retain unknowns as warnings', () => {
  assert.equal(eligibility({role:'Consultant SEO',contract:'CDI'}).eligible,true);
  for (const o of [{contract:'Stage'},{contract:'CDI',role:'Growth Manager'},{contract:'CDI',salaryMin:32000},{contract:'CDI',commuteMinutes:65},{contract:'CDI',regularWeekend:true}])
    assert.equal(eligibility(o).eligible,false);
  assert.match(eligibility({role:'Consultant',contract:'CDI',salaryMin:35000}).warnings.join(','),/36/);
});
test('bold checks fail closed for empty, missing and incorrectly bold text', () => {
  assert.equal(checkBold(fixture,'t.1').passed,true);
  assert.equal(checkBold(fixture,'missing').passed,false);
  assert.equal(checkBold({tabs:[]}).passed,false);
  const broken=structuredClone(fixture);broken.tabs[0].body.content[0].paragraph.elements[1].textRun.textStyle.bold=true;
  assert.equal(checkBold(broken).passed,false);
  const inherited=structuredClone(fixture);delete inherited.tabs[0].body.content[0].paragraph.elements[0].textRun.textStyle.bold;
  inherited.tabs[0].namedStyles={styles:[{namedStyleType:'NORMAL_TEXT',textStyle:{bold:true}}]};
  assert.equal(checkBold(inherited).passed,true);
});
test('replacement plan protects originals, revisions, uniqueness and tab scope', () => {
  const args={doc:fixture,sourceDocumentId:'source',selectedTabId:'t.1',replacements:[['Contenus.','Briefs et contenus.']]};
  const plan=replacementPlan(args);
  assert.equal(plan.write_control.requiredRevisionId,'r1');
  assert.deepEqual(plan.requests[0].replaceAllText.tabsCriteria.tabIds,['t.1']);
  assert.throws(()=>replacementPlan({...args,sourceDocumentId:'copy'}));
  assert.throws(()=>replacementPlan({...args,replacements:[['absent','x']]}));
  assert.throws(()=>replacementPlan({...args,doc:{...fixture,revisionId:''}}));
});
test('quality gate requires real evidence and leaves final approval to user', () => {
  const ok={cv:'https://docs.google.com/document/d/cv/edit',letter:'https://docs.google.com/document/d/letter/edit',bold:{passed:true},pdf:{pages:1,a4:true},factsReviewed:true,visualReviewed:true};
  assert.equal(reviewState(ok).issues.length,0);
  assert.equal(reviewState(ok).status,'À vérifier');
  assert.ok(reviewState({...ok,pdf:{pages:2,a4:true}}).issues.length);
  assert.ok(reviewState({...ok,visualReviewed:false}).issues.length);
  assert.ok(reviewState({...ok,cv:''}).issues.length);
});
