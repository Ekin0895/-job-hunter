import {STATUSES,mergedJobs,loadWorkbook,googleRequest,statusPlan} from './data.mjs';
export const CATEGORIES=['Marketing','Commercial','Administratif / Polyvalent'];
export const REASONS=['Trajet trop long','Salaire insuffisant','Trop senior','Management demandé','Week-end régulier','Missions peu adaptées','Offre inaccessible','Autre'];
export function category(j){if(CATEGORIES.includes(j.category))return j.category;const r=(j.role||'').toLowerCase();if(/seo|geo\b|marketing|growth|crm|acquisition|paid|sea\b|digital|data|social media|traffic|média/.test(r))return 'Marketing';if(/commercial|business develop|sales|sdr\b|bdr\b|charg[ée].*client|conseiller.*client/.test(r))return 'Commercial';if(/administrati|polyvalent|employ[ée]|accueil|assistant|gestionnaire|op[ée]rateur|logistique|pr[ée]parateur|saisie|caisse/.test(r))return 'Administratif / Polyvalent';return 'À classer';}
export function tracked(j){return j.status==='Candidature envoyée'||j.status?.startsWith('Entretien')||['Refus','Offre reçue','Abandonné','Archivée'].includes(j.status);}
export function parisDay(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function validDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function addDays(day,n){if(!validDay(day))throw Error('Date invalide.');const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function markApplied(j,day=parisDay()){if(tracked(j)&&j.status!=='Candidature envoyée')throw Error('Cette candidature est déjà suivie. Modifiez son statut dans le détail.');return {status:'Candidature envoyée',applied:j.applied||day,followUp:j.followUp||addDays(j.applied||day,7)};}
export function jobsForView(data,view,scope='active'){
 const all=mergedJobs(data);
 if(view==='candidates')return data.jobs.filter(j=>!tracked(j)&&!j.discarded);
 if(view==='favorites')return all.filter(j=>j.favorite&&!j.discarded);
 if(view==='history'){if(scope==='legacy')return all.filter(j=>!j.editable&&!tracked(j)&&!j.discarded);if(scope==='closed')return all.filter(j=>j.discarded||['Refus','Abandonné','Offre reçue','Archivée'].includes(j.status));if(scope==='all')return all;return all.filter(j=>j.status==='Candidature envoyée'||j.status?.startsWith('Entretien'));}
 return [];
}
export function todayTasks(data,day=parisDay()){
 const rows=[];for(const j of mergedJobs(data)){if(j.discarded||['Refus','Abandonné','Offre reçue','Archivée'].includes(j.status))continue;
  if(validDay(j.interview)&&j.interview>=day&&j.interview<=addDays(day,7))rows.push({job:j,kind:'interview',title:j.interview===day?'Entretien aujourd’hui':'Préparer l’entretien du '+j.interview,priority:0});
  if(j.status==='Candidature envoyée'&&validDay(j.followUp)&&j.followUp<=day)rows.push({job:j,kind:'followup',title:'Relance à prévoir · '+j.followUp,priority:1});
  if(j.editable&&['À vérifier','Prêt à postuler'].includes(j.status))rows.push({job:j,kind:'review',title:j.status==='Prêt à postuler'?'Candidature prête à envoyer':'CV et lettre à relire',priority:2});
  if(j.status==='Candidature envoyée'&&!validDay(j.applied))rows.push({job:j,kind:'date',title:'Renseigner la date d’envoi',priority:3});
 }return rows.sort((a,b)=>a.priority-b.priority||b.job.score-a.job.score);
}
export function pdfDownloadUrl(raw){try{const u=new URL(raw);if(u.protocol!=='https:'||u.hostname!=='drive.google.com'||u.username||u.password)return '';const id=u.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1];return id?'https://drive.google.com/uc?export=download&id='+id:'';}catch{return '';}}
const COL={status:2,action:7,applied:24,followUp:25,category:30,favorite:31,discarded:32,reason:33,interview:36,personalNotes:38};
function validate(changes){for(const [k,v]of Object.entries(changes)){if(!(k in COL))throw Error('Champ non modifiable.');if(k==='status'&&!STATUSES.includes(v))throw Error('Statut invalide.');if(k==='category'&&!CATEGORIES.includes(v))throw Error('Choisissez une catégorie.');if(['applied','followUp','interview'].includes(k)&&v!==''&&!validDay(v))throw Error('Date invalide.');if(['favorite','discarded'].includes(k)&&typeof v!=='boolean')throw Error('Valeur invalide.');if(!['favorite','discarded'].includes(k)&&(typeof v!=='string'||v.length>5000))throw Error('Texte invalide ou trop long.');}if(changes.discarded&&!changes.reason?.trim())throw Error('Indiquez le motif pour écarter cette offre.');}
function recordValues(j){const v=Array(39).fill('');const fields=['company','role','status','offer','cv','letter','score','action','found','location','salary','remote','source','published','caution','id','contract','missions','skills','fit','cvCheck','letterCheck','verified','commute','applied','followUp','notes','offer','processing','error','category','favorite','discarded','reason','pdfCv','pdfLetter','interview','pdfGenerated','personalNotes'];fields.forEach((k,i)=>{v[i]=j[k]??''});v[30]=CATEGORIES.includes(category(j))?category(j):'';v[31]=j.favorite?'Oui':'Non';v[32]=j.discarded?'Oui':'Non';return v;}
export function editPlan(fresh,previous,changes){
 validate(changes);if(!fresh.extended)throw Error('Le tableau doit être mis à jour pour ces fonctions.');const j=mergedJobs(fresh).find(x=>x.id===previous.id);if(!j)throw Error('Candidature introuvable.');
 for(const k of Object.keys(changes)){const a=j[k]??(['favorite','discarded'].includes(k)?false:''),b=previous[k]??(['favorite','discarded'].includes(k)?false:'');if(a!==b)throw Error('Cette fiche a changé sur un autre appareil. Actualisez avant de réessayer.');}
 if(changes.status==='Prêt à postuler')statusPlan({...fresh,jobs:[{...j,editable:true,sheetId:fresh.sheetId,rowIndex:j.rowIndex||1}]},{...j,editable:true},changes.status);
 const requests=[];let row=j.rowIndex;
 if(!j.editable){row=fresh.lastOccupiedRow+1;if(row>=fresh.rowCapacity)throw Error('Le tableau est plein. Demandez à Work de l’agrandir.');const values=recordValues(j);requests.push({updateCells:{range:{sheetId:fresh.sheetId,startRowIndex:row,endRowIndex:row+1,startColumnIndex:0,endColumnIndex:39},rows:[{values:values.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:String(v)}}))}],fields:'userEnteredValue'}});if(fresh.tableId)requests.push({updateTable:{table:{tableId:fresh.tableId,range:{sheetId:fresh.sheetId,startRowIndex:0,endRowIndex:row+1,startColumnIndex:0,endColumnIndex:39}},fields:'range'}});}
 for(const [k,v]of Object.entries(changes))requests.push({updateCells:{range:{sheetId:fresh.sheetId,startRowIndex:row,endRowIndex:row+1,startColumnIndex:COL[k],endColumnIndex:COL[k]+1},rows:[{values:[{userEnteredValue:{stringValue:typeof v==='boolean'?(v?'Oui':'Non'):v}}]}],fields:'userEnteredValue'}});
 return {requests};
}
export async function saveJobChanges({id,token,previous,changes,fetcher}){const fresh=await loadWorkbook(id,token,fetcher),plan=editPlan(fresh,previous,changes);await googleRequest('https://sheets.googleapis.com/v4/spreadsheets/'+id+':batchUpdate',token,{method:'POST',body:JSON.stringify(plan),fetcher});const result=await loadWorkbook(id,token,fetcher),j=result.jobs.find(x=>x.id===previous.id);if(!j||Object.entries(changes).some(([k,v])=>j[k]!==v))throw Error('L’enregistrement n’a pas pu être confirmé. Actualisez avant de réessayer.');return result;}
