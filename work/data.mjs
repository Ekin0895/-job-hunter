export const STATUSES=['À analyser','Documents en préparation','À vérifier','Prêt à postuler','Candidature envoyée','Entretien RH','Entretien technique','Entretien final','Refus','Offre reçue','Abandonné'];
export const HEADERS=['Entreprise','Poste','Statut','Offre','CV','Lettre','Pertinence /100','Prochaine action','Découverte','Localisation','Salaire annoncé','Télétravail','Source','Publication vérifiable','Vigilance','ID','Contrat','Missions','Compétences demandées','Pourquoi ce score','Contrôle CV','Contrôle lettre','Vérifiée le','Trajet estimé','Candidature envoyée le','Relance le','Notes','URL canonique','État traitement','Dernière erreur'];
export function safeUrl(value,docsOnly=false){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return '';if(docsOnly&&!(u.hostname==='docs.google.com'&&/^\/document\/d\/[^/]+/.test(u.pathname)))return '';return u.href}catch{return ''}}
export function sheetId(raw){const s=String(raw||'').trim();if(/^[\w-]{20,}$/.test(s))return s;try{const u=new URL(s);if(u.hostname!=='docs.google.com'||u.protocol!=='https:')return '';return u.pathname.match(/^\/spreadsheets\/d\/([\w-]+)/)?.[1]||''}catch{return ''}}
export function clientId(raw){return /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/.test(String(raw||''))?raw:''}
const str=c=>String(c?.formattedValue??c?.effectiveValue?.stringValue??c?.userEnteredValue?.stringValue??'');
export const cellUrl=c=>safeUrl(c?.hyperlink||c?.textFormatRuns?.find(r=>r.format?.link?.uri)?.format.link.uri||c?.userEnteredFormat?.textFormat?.link?.uri||str(c));
function gridRows(sheet){return (sheet?.data||[]).flatMap(block=>(block.rowData||[]).map((r,i)=>({index:(block.startRow||0)+i,cells:r.values||[]})));}
export function parseWorkbook(book){
 const prepared=book.sheets?.find(s=>s.properties?.title==='Candidatures');
 if(!prepared)throw Error('Onglet Candidatures absent. Vérifiez le tableau sélectionné.');
 const entries=gridRows(prepared),header=entries.find(r=>r.index===0);
 if(!header||HEADERS.some((h,i)=>str(header.cells[i])!==h))throw Error('Les colonnes du tableau ont changé. Aucune écriture ne sera effectuée.');
 const jobs=entries.filter(r=>r.index>0&&str(r.cells[15])).map(({index,cells:c})=>({
   id:str(c[15]),company:str(c[0]),role:str(c[1]),status:str(c[2]),offer:safeUrl(str(c[27]))||cellUrl(c[3]),cv:safeUrl(cellUrl(c[4]),true),letter:safeUrl(cellUrl(c[5]),true),score:Number(str(c[6]).replace(',','.'))||0,action:str(c[7]),found:str(c[8]),location:str(c[9]),salary:str(c[10]),remote:str(c[11]),source:str(c[12]),published:str(c[13]),caution:str(c[14]),contract:str(c[16]),missions:str(c[17]),skills:str(c[18]),fit:str(c[19]),cvCheck:str(c[20]),letterCheck:str(c[21]),verified:str(c[22]),commute:str(c[23]),applied:str(c[24]),followUp:str(c[25]),notes:str(c[26]),processing:str(c[28]),error:str(c[29]),rowIndex:index,sheetId:prepared.properties.sheetId,editable:true
 }));
 if(jobs.some(j=>!j.company||!j.role)||new Set(jobs.map(j=>j.id)).size!==jobs.length)throw Error('Identifiants en double ou fiche incomplète : écriture bloquée.');
 const old=book.sheets?.find(s=>s.properties?.title==='Suivi');
 const history=gridRows(old).filter(r=>r.index>=8&&/^\d+$/.test(str(r.cells[0]))).map(({cells:c})=>({id:'JH-'+str(c[0]).padStart(4,'0'),company:str(c[3]),role:str(c[4]),status:str(c[1])==='Prête'?'À analyser':str(c[1])==='Entretien'?'Entretien RH':str(c[1]),offer:cellUrl(c[10]),cv:'',letter:'',score:0,action:str(c[12]),found:'',location:str(c[5]),salary:str(c[6]),remote:str(c[7]),source:'Historique conservé',caution:str(c[9]),fit:str(c[8]),verified:str(c[11]),followUp:str(c[13]),notes:str(c[14]),processing:'Historique — documents non vérifiés dans ce registre',editable:false}));
 const log=book.sheets?.find(s=>s.properties?.title==='Journal');
 const activity=gridRows(log).filter(r=>r.index>0&&str(r.cells[0])).map(({cells:c})=>({id:str(c[0]),started:str(c[1]),finished:str(c[2]),state:str(c[3]),newOffers:str(c[4]),completed:str(c[5]),evidence:str(c[6]),error:str(c[7])})).reverse();
 return {jobs,history,activity};
}
export function mergedJobs({jobs,history}){const m=new Map(history.map(j=>[j.id,j]));for(const j of jobs)m.set(j.id,j);return [...m.values()]}
export function summarize(data){const all=mergedJobs(data);return {review:data.jobs.filter(j=>j.status==='À vérifier').length,ready:data.jobs.filter(j=>j.status==='Prêt à postuler'&&j.cv&&j.letter).length,sent:all.filter(j=>j.status==='Candidature envoyée').length,interviews:all.filter(j=>j.status.startsWith('Entretien')).length};}
export function statusPlan(fresh,previous,next){
 if(!STATUSES.includes(next))throw Error('Statut invalide.');
 const matches=fresh.jobs.filter(j=>j.id===previous.id);
 if(matches.length!==1||!previous.editable)throw Error('Candidature introuvable ou historique en lecture seule.');
 const j=matches[0];
 if(j.status!==previous.status)throw Error('Le statut a changé sur un autre appareil. Actualisez avant de réessayer.');
 const incomplete=/non vérifi|non inspect|manquant|trop long|échec|echec|débord|pagination.*confirmer/i.test(j.cvCheck+' '+j.letterCheck);
 if(next==='Prêt à postuler'&&(!j.cv||!j.letter||!j.cvCheck||!j.letterCheck||j.error||incomplete))throw Error('Documents ou contrôles manquants. Vérifiez la fiche avant de la déclarer prête.');
 return {requests:[{updateCells:{range:{sheetId:j.sheetId,startRowIndex:j.rowIndex,endRowIndex:j.rowIndex+1,startColumnIndex:2,endColumnIndex:3},rows:[{values:[{userEnteredValue:{stringValue:next}}]}],fields:'userEnteredValue'}}]};
}
export async function googleRequest(url,token,{fetcher=fetch,...options}={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const res=await fetcher(url,{...options,signal:controller.signal,headers:{Authorization:'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})},cache:'no-store'});
  let data;try{data=await res.json()}catch{throw Error('Réponse Google illisible. Aucune réussite confirmée.');}
  if(!res.ok){const reason=data.error?.details?.find(d=>d.reason)?.reason||'';const forbidden=reason==='SERVICE_DISABLED'?'L’API Google Sheets est désactivée dans le projet Google Cloud. Activez-la, puis actualisez.':('Google refuse cet accès. '+(data.error?.message||'Vérifiez le compte et les autorisations.'));const e=Error(res.status===401?'Votre connexion Google a expiré. Reconnectez-vous.':res.status===403?forbidden:res.status===429?'Quota Google atteint. Réessayez plus tard.':data.error?.message||'Erreur Google '+res.status);e.code=res.status;throw e;}
  return data;
 }catch(e){if(e.name==='AbortError')throw Error('Délai Google dépassé. Actualisez pour vérifier le résultat avant toute nouvelle tentative.');throw e}finally{clearTimeout(timer)}
}
export function workbookUrl(id){if(!sheetId(id)||sheetId(id)!==id)throw Error('Tableau invalide');const q=new URLSearchParams();for(const r of ['Candidatures!A1:AD500','Suivi!A8:O953','Journal!A1:H100'])q.append('ranges',r);q.set('includeGridData','true');q.set('fields','sheets(properties(sheetId,title),data(startRow,rowData(values(formattedValue,userEnteredValue,effectiveValue,hyperlink,textFormatRuns,userEnteredFormat(textFormat(link))))))');return 'https://sheets.googleapis.com/v4/spreadsheets/'+id+'?'+q;}
export async function loadWorkbook(id,token,fetcher){return parseWorkbook(await googleRequest(workbookUrl(id),token,{fetcher}));}
export async function saveStatus({id,token,previous,next,fetcher}){
 const fresh=await loadWorkbook(id,token,fetcher),plan=statusPlan(fresh,previous,next);
 // No automatic retry: the provider may have applied a timed-out write.
 await googleRequest('https://sheets.googleapis.com/v4/spreadsheets/'+id+':batchUpdate',token,{method:'POST',body:JSON.stringify(plan),fetcher});
 const verified=await loadWorkbook(id,token,fetcher);
 if(verified.jobs.find(j=>j.id===previous.id)?.status!==next)throw Error('Le statut n’a pas pu être confirmé après écriture. Actualisez avant de réessayer.');
 return verified;
}

export function resolveConfig(saved,defaults){return {sheet:sheetId(saved?.sheet)||sheetId(defaults?.sheet),client:clientId(saved?.client)||clientId(defaults?.client)};}
