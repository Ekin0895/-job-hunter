# Job Hunter — interface du parcours Work / Google

Version de développement indépendante, dans `work/`. Elle ne remplace pas `index.html` et ne modifie pas la V9.

## Architecture

- Work recherche les annonces, analyse et prépare les documents avec les connecteurs existants.
- Le tableau Google Sheets privé est le registre partagé. Ses colonnes A:AD sont validées avant toute opération.
- Cette interface lit ce même registre avec le compte Google du candidat ; aucun transfert Supabase n'est nécessaire.
- Les documents restent dans Google Drive. L'application ne contient ni contenu de CV privé, ni jeton, ni mot de passe.
- Les statuts du nouveau registre sont modifiables ; l'ancien historique reste accessible en lecture seule.

## Utilisation

Servir les quatre fichiers `index.html`, `styles.css`, `app.mjs` et `data.mjs` depuis une origine HTTPS autorisée par le client OAuth Google. Ouvrir les réglages, renseigner le tableau et le client OAuth, puis connecter Google. Une configuration initiale peut également être transmise par fragment `#sheet=<ID>&client=<CLIENT_ID>` ; le fragment est retiré après mémorisation. Ne jamais inclure de jeton dans un lien.

Le compte doit déjà avoir accès au tableau. Le scope demandé est `spreadsheets`, utilisé pour lire le suivi et modifier les statuts. Aucun document n'est rendu public. Les réglages non secrets restent dans localStorage ; le jeton d'accès ne reste qu'en mémoire. Les candidatures ne sont pas mises en cache entre sessions. Une reconnexion peut être nécessaire après expiration du jeton.

L'import occasionnel copie une demande à transmettre à Work. Il ne déclenche pas un agent à distance. Cette limite est indiquée dans l'interface. La tâche quotidienne existante continue de traiter le registre, indépendamment de l'ouverture de l'interface.

## Contrôles réalisés le 7 novembre 2026

```sh
node --check work/app.mjs
node --test tests/work-app.test.mjs tests/workflow-core.test.mjs
```

- Douze tests passent : sécurité des liens, lecture des vrais liens Google, schéma/IDs, contrôle des statuts, conflit visible et absence de répétition automatique des écritures, readback obligatoire, erreurs de connexion/permissions/quota et contrôles documentaires.
- Le parseur a traité une lecture réelle du tableau via le connecteur : 3 dossiers préparés, 3 paires de liens CV/lettre, 45 offres historiques. Compteurs : 3 à vérifier, 0 prêt, 10 candidatures envoyées et 1 entretien en incluant l'historique dédupliqué.
- Aperçu navigateur : navigation, recherche, filtres et détail contrôlés avec des exemples explicitement fictifs ; aucune de ces fiches n'est enregistrée dans Google.
- Affichage vérifié dans un viewport de 390 px via une iframe de test, sans débordement horizontal. Cela ne remplace pas un test Safari sur un iPhone physique.

## Non encore validé

- Authentification Google depuis l'origine finale : elle dépend de sa présence dans les origines autorisées du client Google Cloud. L'accès à cette console n'est pas confirmé dans la session.
- Écriture d'un statut depuis le navigateur authentifié : code testé avec réponses simulées et préparation d'une requête sur une lecture réelle, mais pas de mutation distante par cette interface.
- Exécution autonome documentaire de la tâche quotidienne : le test immédiat précédent était inline.
- Publication : aucune. Le candidat a interdit tout déploiement et toute modification de `main` sans accord explicite.

La lecture avant écriture protège d'un changement déjà visible, sans être un compare-and-swap atomique Google Sheets. Les enregistrements sont relus après l'écriture ; aucun retry automatique après un timeout. Une garantie de concurrence stricte exigerait un mécanisme transactionnel supplémentaire.

L'aperçu `?demo=1` montre uniquement des exemples fictifs. Il ne prouve ni une connexion Google, ni une recherche réelle, ni une génération documentaire. Aucune API d'IA payante n'est appelée par cette interface.
