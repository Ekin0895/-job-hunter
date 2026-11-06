# Validation de la V10

## Fonctionnalités présentes dans la branche

- Gestion des offres et des étapes de candidature, import/export JSON, recherche et prévention des doublons.
- Synchronisation Supabase avec état local conservé, comparaison des versions pour l'enregistrement et la suppression, sauvegarde de récupération et contrôle avant rafraîchissement.
- Script SQL versionné pour la RPC d'enregistrement, table par utilisateur et RLS ; RPC de suppression conditionnelle séparée.
- Brouillons CV modifiables pour Marketing, Commercial et Admin/polyvalent, construits à partir des faits présents dans les documents de référence de l'utilisateur.
- Lettres modifiables prenant en compte description et exigences saisies dans la fiche ; export texte et impression PDF du navigateur.
- Copies via les modèles Google Docs existants ; les modèles originaux ne sont pas modifiés.
- Shell PWA V10 avec chemin d'icône existant et cache de version distinct.

## Contrôles exécutés

Commande : `node tests/smoke.mjs`

Le test passe : syntaxe du script inline, détection d'URL et de doublons, contrôles de récupération cloud, présence des actions documentaires, contenu attendu des brouillons CV/lettre et chemins des ressources PWA.

## À vérifier avant de considérer la V10 livrée

- Exécuter les deux scripts SQL dans un environnement Supabase autorisé et confirmer le schéma existant, les règles RLS, les accès RPC et l'authentification.
- Tester les écritures concurrentes et suppressions sur deux appareils réels.
- Vérifier le rendu dans Safari iOS, Chrome Android et sur Mac ; le navigateur de prévisualisation local n'était pas accessible depuis l'outil d'interface.
- Copier les modèles Google Docs et vérifier la fidélité de mise en page après insertion de texte.
- Vérifier que CV et lettres tiennent sur une page après export PDF ; les tests automatiques ne garantissent pas la pagination.
- Confirmer les dates/énoncés des expériences dans les documents sources avant d'utiliser chaque brouillon.

La V10 n'a pas été publiée et aucune branche n'a été fusionnée.
