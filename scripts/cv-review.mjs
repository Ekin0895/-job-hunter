import {checkBold,flattenTabs,tabId} from './workflow-core.mjs';
const unescapeXml=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
export function checkCvFooter(doc,targetTab,bbox){
 const tab=flattenTabs(doc).find(t=>tabId(t)===targetTab),footers=tab?.documentTab?.footers||tab?.footers;
 const paragraphs=Object.values(footers||{}).flatMap(f=>(f.content||[]).filter(x=>x.paragraph));
 const content=paragraphs.map(p=>p.paragraph.elements.map(e=>e.textRun?.content||'').join('')).join('');
 const failures=[];if(!content.trim())failures.push('Pied de page absent');
 if(paragraphs.length!==1)failures.push('Le pied de page doit tenir dans un seul paragraphe');
 if(!/@/.test(content)||!/linkedin\.com\/in\//.test(content)||!/(?:\d[ .]?){10}/.test(content))failures.push('Coordonnées du pied de page incomplètes');
 let rendered=false;
 if(bbox!==undefined){const pages=[...bbox.matchAll(/<page\b([^>]*)>([\s\S]*?)<\/page>/g)];if(pages.length!==1)failures.push('Le PDF doit contenir une page');
  const page=pages[0];if(page){const width=Number(page[1].match(/width="([\d.]+)"/)?.[1]),height=Number(page[1].match(/height="([\d.]+)"/)?.[1]);if(Math.abs(width-595.28)>2||Math.abs(height-841.89)>2)failures.push('Format PDF non A4');
   const words=[...page[2].matchAll(/<word\b([^>]*)>([\s\S]*?)<\/word>/g)].map(m=>({y:Number(m[1].match(/yMin="([\d.]+)"/)?.[1]),text:unescapeXml(m[2])})).filter(w=>w.y>height*.94);
   if(!words.length)failures.push('Pied de page non visible dans le PDF');else{const ys=words.map(w=>w.y);if(Math.max(...ys)-Math.min(...ys)>1.5)failures.push('Pied de page rendu sur plusieurs lignes');if(words.map(w=>w.text).join('').replace(/\s/g,'')!==content.replace(/\s/g,''))failures.push('Le PDF ne restitue pas toutes les coordonnées');}
   rendered=true;
  }
 }
 return {present:!!content.trim(),rendered,failures,passed:failures.length===0&&rendered};
}
export function reviewCv(doc,targetTab,bbox){const bold=checkBold(doc,targetTab),footer=checkCvFooter(doc,targetTab,bbox);return {bold,footer,passed:bold.passed&&footer.passed};}
