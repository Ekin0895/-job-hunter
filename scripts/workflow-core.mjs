// Pure validation helpers for the Google-connected workflow. No credentials or API calls.
export function canonicalUrl(raw) {
  try {
    const u = new URL(raw);
    if (!['https:', 'http:'].includes(u.protocol)) return '';
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (/(^|\.)linkedin\.com$/.test(host)) {
      const id = u.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)\/?$/)?.[1];
      if (id) return `https://www.linkedin.com/jobs/view/${id}`;
    }
    if (/(^|\.)indeed\.com$/.test(host) && u.searchParams.get('jk'))
      return `https://indeed.com/viewjob?jk=${u.searchParams.get('jk')}`;
    u.hash = '';
    for (const k of [...u.searchParams.keys()])
      if (/^(utm_.*|trk|trackingId|refId|promotion|source|fbclid|gclid)$/i.test(k)) u.searchParams.delete(k);
    u.pathname = u.pathname.replace(/\/applications\/new\/?$/, '').replace(/\/$/, '');
    u.searchParams.sort();
    return u.origin + u.pathname + u.search;
  } catch { return ''; }
}
export const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function duplicateOf(offer, rows) {
  const url = canonicalUrl(offer.url);
  return rows.find(r => (url && canonicalUrl(r.url) === url) ||
    (normalize(offer.company) && normalize(offer.role) && normalize(r.company) === normalize(offer.company) &&
      normalize(r.role) === normalize(offer.role) &&
      (!offer.location || !r.location || normalize(r.location) === normalize(offer.location))));
}
export function eligibility(offer) {
  const reasons = [], warnings = [];
  if (offer.contract !== 'CDI') reasons.push('CDI non confirmé');
  if (/\b(senior|sénior|manager|head|lead|directeur|directrice)\b/i.test(offer.role || '') || offer.management === true) reasons.push('Niveau/management exclu');
  if (offer.regularWeekend === true) reasons.push('Week-end régulier');
  if (offer.salaryMax != null && offer.salaryMax < 35000) reasons.push('Rémunération publiée sous 35 k€');
  if (offer.salaryMin != null && offer.salaryMin < 35000) reasons.push('Plancher publié sous 35 k€');
  if (offer.salaryMin == null) warnings.push('Salaire non publié');
  else if (offer.salaryMin < 36000) warnings.push('Fixe/plancher sous objectif 36 k€');
  if (offer.commuteMinutes == null) warnings.push('Trajet non vérifié');
  else if (offer.commuteMinutes > 50) reasons.push('Trajet supérieur à 50 min depuis la gare');
  if (offer.remoteDays == null) warnings.push('Nombre de jours de télétravail inconnu');
  return {eligible: reasons.length === 0, reasons, warnings};
}
export function flattenTabs(doc) {
  return (doc.tabs || []).flatMap(function visit(t) {return [t, ...(t.childTabs || []).flatMap(visit)];});
}
export const tabId = t => t.tabProperties?.tabId || t.tabId;
export const tabBody = t => t.documentTab?.body || t.body;
export function paragraphs(tab) {
  function walk(content) {
    return (content || []).flatMap(e => e.paragraph ? [e] : e.table ?
      e.table.tableRows.flatMap(r => r.tableCells.flatMap(c => walk(c.content))) : []);
  }
  return walk(tabBody(tab)?.content);
}
export const paragraphText = p => (p.paragraph?.elements || []).map(e => e.textRun?.content || '').join('');
export function checkBold(doc, targetTab) {
  const selected = flattenTabs(doc).filter(t => !targetTab || tabId(t) === targetTab);
  const failures = [];
  if (!selected.length) failures.push('Onglet absent');
  let checked = 0;
  for (const t of selected) {
    const named = (t.documentTab?.namedStyles || t.namedStyles || doc.namedStyles)?.styles || [];
    for (const p of paragraphs(t)) {
      const line = paragraphText(p), colon = line.indexOf(':');
      // Only standalone label paragraphs, never URLs or an arbitrary description containing a colon.
      if (colon < 1 || colon > 60 || /https?:\/\//i.test(line.slice(0, colon + 3))) continue;
      checked++;
      const styleName = p.paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
      const inherited = named.find(s => s.namedStyleType === styleName)?.textStyle?.bold ?? false;
      let offset = 0;
      for (const e of p.paragraph.elements || []) {
        const run = e.textRun;
        if (!run) continue;
        const bold = run.textStyle?.bold ?? inherited;
        for (let i = 0; i < run.content.length; i++) {
          if (/\s/.test(run.content[i])) continue;
          if (bold !== (offset + i <= colon)) {failures.push({tab: tabId(t), line: line.trim(), offset: offset + i}); break;}
        }
        offset += run.content.length; // UTF-16, matching Google Docs indexes.
      }
    }
  }
  if (!checked) failures.push('Aucun libellé contrôlable');
  return {checked, failures, passed: checked > 0 && failures.length === 0};
}
export function replacementPlan({doc, sourceDocumentId, selectedTabId, replacements}) {
  if (!doc.documentId || doc.documentId === sourceDocumentId) throw Error('Une copie distincte est obligatoire');
  if (!doc.revisionId) throw Error('Révision obligatoire');
  const target = flattenTabs(doc).find(t => tabId(t) === selectedTabId);
  if (!target) throw Error('Onglet absent');
  const text = paragraphs(target).map(paragraphText).join('');
  const seen = new Set();
  const requests = replacements.map(([from, to]) => {
    if (!from || seen.has(from) || typeof to !== 'string') throw Error('Remplacement ambigu');
    seen.add(from);
    if (text.split(from).length !== 2) throw Error('Texte absent ou non unique');
    return {replaceAllText: {containsText: {text: from, matchCase: true}, replaceText: to, tabsCriteria: {tabIds: [selectedTabId]}}};
  });
  return {document_id: doc.documentId, write_control: {requiredRevisionId: doc.revisionId}, requests};
}
export function reviewState({cv, letter, bold, pdf, factsReviewed, visualReviewed}) {
  const issues = [];
  if (!/^https:\/\/docs\.google\.com\/document\/d\/[^/]+/.test(cv || '')) issues.push('CV manquant');
  if (!/^https:\/\/docs\.google\.com\/document\/d\/[^/]+/.test(letter || '')) issues.push('Lettre manquante');
  if (!bold?.passed) issues.push('Gras non validé');
  if (pdf?.pages !== 1 || pdf?.a4 !== true) issues.push('Pagination A4 non validée');
  if (!factsReviewed) issues.push('Faits non relus');
  if (!visualReviewed) issues.push('Rendu non inspecté');
  // Human approval is a separate event. This function never marks a job ready to send.
  return {status: 'À vérifier', processing: issues.length ? 'Contrôles manquants' : 'Documents vérifiés — relecture utilisateur', issues};
}
