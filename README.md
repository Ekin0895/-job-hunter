# Job Hunter V10

Cette version est en développement sur `develop/job-hunter-v10`. La V9 servie par `main` reste séparée. Ne pas fusionner ni déployer cette branche sans validation explicite.

## Fonctionnalités

- Suivi des annonces, filtres, catégories, pipeline de candidatures et sauvegarde JSON.
- Synchronisation Supabase par compte avec contrôle de version des mises à jour et suppressions.
- Détection des annonces en double et import guidé à partir d'un lien ou du texte d'une annonce.
- Brouillons de CV et de lettres fondés sur les expériences enregistrées dans les modèles Ekin ; tous deux restent modifiables et doivent être relus.
- Liens de copie des modèles Google Docs Marketing/Klox et Commercial/Happypal. Le contenu des originaux n'est pas modifié.
- Interface responsive et shell PWA V10.

## Configuration Supabase

Les scripts dans `supabase/` sont des migrations à examiner et exécuter dans le SQL Editor du projet Supabase avant de tester la synchronisation. `job_hunter_save.sql` crée la table attendue si elle n'existe pas, applique une politique RLS par utilisateur et installe la RPC de sauvegarde versionnée. `job_hunter_delete.sql` installe la suppression conditionnelle. Ces scripts n'ont pas été exécutés sur le projet distant.

Le client statique n'embarque que la clé publique Supabase et stocke la session dans le navigateur. Les données cloud restent protégées par RLS et les RPC contrôlent l'utilisateur connecté.

## Vérifications locales

```sh
node tests/smoke.mjs
```

Ce test valide la syntaxe inline, les fonctions clés de synchronisation, les brouillons CV/lettre, le contenu factuel de quelques exemples et les ressources PWA présentes. Il ne remplace pas les tests d'authentification réelle, de concurrence Supabase, d'affichage navigateur ou de pagination PDF.

Voir `V10-RECETTE.md` et `V10-VALIDATION.md` pour les scénarios avant mise en production.
