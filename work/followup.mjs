import {validDay,parisDay} from './workflow.mjs';
const clean=s=>String(s||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
const date=s=>new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
export function canFollowUp(job){return !job.discarded&&(job.status==='Candidature envoyée'||job.status?.startsWith('Entretien'));}
export function followupDraft(job,{stage='application',contact='',today=parisDay()}={}){
 if(!canFollowUp(job))throw Error('Une relance se prépare pour une candidature envoyée ou un entretien en cours.');
 if(!['application','interview'].includes(stage))throw Error('Étape de relance invalide.');
 const company=clean(job.company),role=clean(job.role);if(!company||!role)throw Error('Entreprise ou poste manquant.');
 const person=clean(contact),greeting=person?'Bonjour '+person+',':'Bonjour,';
 const applied=validDay(job.applied)&&job.applied<=today?date(job.applied):'';
 const interview=validDay(job.interview)&&job.interview<=today?date(job.interview):'';
 const mission=clean(job.missions).split(/\s*[;\n•]\s*/).find(x=>x.length>5&&x.length<125)?.replace(/[.!?]+$/,'');
 const focus=mission?' Les missions autour de « '+mission+' » m’intéressent particulièrement.':'';
 const intro=stage==='interview'?'Je fais suite à notre échange'+(interview?' du '+interview:'')+' concernant le poste de '+role+' chez '+company+'.':'Je reviens vers vous au sujet de ma candidature au poste de '+role+' chez '+company+(applied?', déposée le '+applied:'')+'.';
 const body=greeting+'\n\n'+intro+'\n\n'+(stage==='interview'?'Je reste intéressé par cette opportunité.':'Je suis toujours intéressé par ce poste.')+focus+' Avez-vous des nouvelles concernant '+(stage==='interview'?'la suite du recrutement':'l’avancement de ma candidature')+' ?\n\nJe reste disponible pour échanger ou vous transmettre un complément d’information.\n\nBonne journée,\nEkin Ikizer';
 const notes=[];if(stage==='interview'&&!interview)notes.push('La date de l’entretien n’est pas ajoutée au texte. Choisissez cette étape seulement si l’échange a déjà eu lieu.');if(stage==='application'&&!applied)notes.push('La date d’envoi n’est pas connue ou est future : elle n’est pas ajoutée au message.');
 if(validDay(job.followUp)&&job.followUp>today)notes.push('Relance prévue le '+date(job.followUp)+'. Vous pouvez préparer le message dès maintenant.');
 return {subject:(stage==='interview'?'Suite à notre entretien — ':'Suivi de candidature — ')+role,body,notes};
}
