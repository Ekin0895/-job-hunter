# Job Hunter : audit et bascule vers les outils Google connectés

Audit initial de `develop/job-hunter-v10` au commit `411714f5475aad22f70660bdfa119ecf88b27c45`.
`main` observée à `72f602b8dccc206d4f3115cf40f679040e7af8dd`. Aucune publication ni fusion.
Les identifiants des documents privés et les données personnelles restent hors de ce rapport public.

## Diagnostic du code existant

| Composant | Constat dans le code | Preuve et limite |
|---|---|---|
| Import URL | `fetch` côté navigateur ; extraction JSON-LD/texte ; collage de secours | CORS et pages protégées ne sont pas résolus par ce code ; pas d'accès universel LinkedIn |
| CV Google | Copie native, puis remplacement du titre et éventuellement de la ligne GEO | Ne personnalise pas réellement toutes les expériences ; conserve plusieurs variantes dans la copie |
| Lettres | Paragraphes prédéfinis et sélection par expressions régulières | Brouillons à règles, pas analyse/rédaction IA complète ; pas création d'une lettre Google Docs dans ce flux |
| OAuth | Google Identity Services, jeton d'accès en mémoire | Dépend d'une session utilisateur ; aucune orchestration quotidienne serveur dans ce dépôt |
| Supabase | RPC versionnées, RLS et protections de conflit dans SQL/client | Présence du code seulement ; pas de test distant d'authentification, RLS ou concurrence pendant cet audit |
| PWA | Manifest et service worker présents | Cache de l'interface, pas moteur autonome de candidatures |
| Tests V10 | `node tests/smoke.mjs` échoue | Assertion `CONSULTANT SEO` avec un exemple dont le poste vaut `SEO` ; le rapport antérieur « passe » n'est plus une preuve à cette révision |
| Recette | Plusieurs cases de contrôle encore ouvertes | Pas de preuve end-to-end distante ou sur iPhone dans les anciens documents |

## Architecture retenue

| Option | Décision | Motif |
|---|---|---|
| A : ChatGPT + Sheets + Docs | Retenue pour le prototype | Lecture/écriture natives réellement disponibles en session ; tableau et fichiers privés durables ; aucun appel à une API d'IA payante |
| B : Apps Script + ChatGPT | Non retenue comme moteur IA | Apps Script pourrait gérer les opérations Google, mais aucune passerelle gratuite vers la rédaction avec l'abonnement n'est démontrée ici ; ne pas confondre Plus et crédit API |
| C : hybride V10 | Facultative, hors chemin critique | Garder l'historique et les contrôles utiles ; éviter une seconde base Supabase et un second mécanisme OAuth pour les mêmes candidatures |

Documentation officielle consultée : https://learn.chatgpt.com/docs/automations
Les tâches Web peuvent utiliser des outils connectés selon leur contexte et leurs autorisations. Cela ne démontre ni la persistance de toutes les autorisations ni une heure de livraison exacte.

## Réalisé et vérifié en session

- Lecture des deux Google Docs fournis, des cinq variantes du CV, d'une lettre existante et du suivi existant.
- Création privée d'un tableau central par copie : les 45 offres historiques et les anciennes feuilles restent conservées ; l'original n'est pas modifié.
- Ajout de Candidatures (table native, statut déroulant, liens, score, contrôles et erreurs), Pilotage et Journal.
- Trois dossiers préparés : un nouveau et deux historiques complétés ; six Google Docs distincts, réécriture réelle des descriptions selon SEO/projet, CRM ou marketing B2B.
- Six PDF exportés par Google : chacun une page A4, puis rendu PNG inspecté. Les PDF servent à contrôler le rendu ; les livrables restent des Google Docs.
- Contrôle des 51 paragraphes à libellé des trois CV : gras jusqu'aux deux-points inclus seulement. Dates, intitulés d'expériences et formations source conservés ; marges de 90 pt conservées, seule la page des copies passe de Letter à A4.
- Révision du CV original inchangée après les écritures. Permissions des nouveaux documents et du tableau relues : propriétaire seulement, aucun partage public.
- Déduplication réelle d'une offre historique avec URL officielle `/jobs/<id>` versus `/jobs/<id>/applications/new`.
- Réservations de lignes et liens enregistrés avant personnalisation pour permettre la reprise sans copie aveugle.
- Relecture des liens, valeurs et compteurs ; adaptation des séparateurs de formules à la locale française.
- Tâche quotidienne existante inspectée puis mise à jour, sans doublon : nouveaux critères et procédure persistante privée. Heure visée 8 h Europe/Paris ; mode de planification encore flexible.

## Automatisation : statut exact

Le dernier ancien run enregistré était terminé le 6 novembre et déclarait zéro nouvelle offre ; il n'avait pas produit de documents. Sa trace ne prouve donc pas l'écriture documentaire.

`run_now` a renvoyé `inline_run` : l'essai immédiat a été exécuté dans la conversation active. Il valide le parcours interactif avec outils Google, **pas une exécution indépendante**. Le premier lancement planifié doit encore prouver la lecture du référentiel et l'écriture dans Journal, puis la préparation documentaire. Les instructions demandent de signaler tout accès manquant et interdisent d'annoncer une génération non effectuée.

Les états automatiques restent « À vérifier ». « Prêt à postuler » appartient à la validation humaine. Aucune candidature ni aucun message à un recruteur n'a été envoyé.

## Contrôles réutilisables

`scripts/workflow-core.mjs` fournit des fonctions pures : URL canonique, déduplication, critères explicites et inconnus, remplacement borné à une copie/révision/onglet, gras et états de qualité. Il n'appelle aucune API et n'est pas un ordonnanceur. La procédure de la tâche et les connecteurs exécutent les opérations ; ces fonctions peuvent en vérifier les entrées et sorties.

```sh
node --test tests/workflow-core.test.mjs
```

Six tests passent : variantes LinkedIn/Indeed/application, déduplication intersource, critères d'exclusion, contrôles du gras y compris styles hérités, protection des originaux et qualité sans validation automatique d'envoi. Les fonctions ont aussi été exécutées sur les trois réponses Google Docs réelles : un onglet par CV, 17 libellés conformes par document, A4 et faits structurants préservés. Les réponses privées ne sont pas commitées.

## Limites restantes

- Exécution autonome documentaire à confirmer au prochain run ; aucun outil de cette session n'a fourni un test immédiat détaché.
- Aucun test sur iPhone physique. Le navigateur de contrôle n'est pas connecté à Google ; rendu natif Sheets non inspecté à l'écran, métadonnées/valeurs/formats vérifiés via connecteur.
- Dates source chevauchées entre deux employeurs : conservées et signalées, à clarifier par le candidat avant envoi.
- Certains salaires, adresses et politiques de télétravail ne sont pas publiés ; les fiches distinguent ces inconnues et les estimations.
- Un bail logique dans Journal réduit les recouvrements ; Google Sheets ne fournit pas ici une transaction atomique multi-fichiers. Ne pas présenter la reprise comme une garantie d'exactement une exécution face à une panne réseau.
- La V10 et ses tests historiques ne sont pas déclarés réparés par l'ajout de ces contrôles. Son interface n'est plus nécessaire au prototype Google.
