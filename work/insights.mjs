import {mergedJobs} from './data.mjs';
export function insights(data){
 const buckets=[['preparing','À préparer','#6d91c6'],['review','À vérifier','#e5ba6d'],['ready','Prêtes à postuler','#62e8b5'],['sent','Envoyées','#67b8f2'],['interview','Entretiens','#b6a0ef'],['closed','Clôturées','#c5839b'],['other','Autres statuts','#7c91a7']].map(([key,label,color])=>({key,label,color,count:0}));
 const all=mergedJobs(data);
 for(const j of all){const s=j.status||'';let key=s.startsWith('Entretien')?'interview':['À analyser','Documents en préparation','À examiner','CV à préparer','Prête'].includes(s)?'preparing':s==='À vérifier'?'review':s==='Prêt à postuler'?'ready':s==='Candidature envoyée'?'sent':['Refus','Abandonné','Archivée','Offre reçue'].includes(s)?'closed':'other';buckets.find(b=>b.key===key).count++;}
 const documents=[{label:'CV et lettre disponibles',count:0,color:'#62e8b5'},{label:'Un document manquant',count:0,color:'#e5ba6d'},{label:'Aucun document associé',count:0,color:'#6d91c6'}];
 for(const j of data.jobs){documents[j.cv&&j.letter?0:j.cv||j.letter?1:2].count++;}
 return {total:all.length,buckets:buckets.filter(b=>b.count),documents,preparedTotal:data.jobs.length};
}
