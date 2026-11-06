# Recette V10 — candidatures, synchronisation et documents

> Branche cible : `develop/job-hunter-v10`. La V9 en production reste sur `main`. Ne pas fusionner ni déployer sans accord explicite.

## Avant l'essai

1. Faire une sauvegarde JSON de la V9 et la conserver en lieu sûr.
2. Servir cette branche V10 sur une URL de prévisualisation distincte, sans remplacer l'URL de production.
3. Examiner puis exécuter `supabase/job_hunter_save.sql` et `supabase/job_hunter_delete.sql` dans un projet Supabase de test ou après approbation, jamais avec des candidatures réelles pour les scénarios destructifs.
4. Utiliser deux navigateurs ou appareils connectés au même compte de test.

## Candidatures et synchronisation

- [ ] Créer, modifier et supprimer une annonce ; vérifier les champs, statuts, filtres et compteurs.
- [ ] Ajouter une annonce par URL et coller le texte si la plateforme bloque l'extraction.
- [ ] Importer deux fois le même JSON : aucune offre en double n'est créée.
- [ ] Connecter un compte test : les lignes de l'utilisateur connecté apparaissent ; les données locales divergentes ne sont pas écrasées silencieusement.
- [ ] Créer une offre sur le Mac et vérifier sa réception sur le téléphone.
- [ ] Modifier la même offre sur les deux appareils avec des versions différentes : l'écriture obsolète doit être refusée et l'état local sauvegardé.
- [ ] Supprimer une offre test sur un appareil et vérifier que sa version périmée ne peut pas la ressusciter.
- [ ] Annuler la confirmation d'une suppression cloud : la ligne distante reste présente.
- [ ] Couper le réseau pendant une sauvegarde : le JSON local reste exportable et une reprise ne remplace pas l'état sans vérification.
- [ ] Se déconnecter puis reconnecter : vérifier qu'aucune candidature d'un compte précédent n'est montrée.

## CV et lettres

- [ ] Générer des brouillons Marketing, Commercial et Admin/polyvalent ; vérifier chaque date et chaque affirmation avec le modèle source.
- [ ] Modifier un brouillon : la validation manuelle du document repasse à « Non ».
- [ ] Copier le modèle Google Docs associé et vérifier que seul le nouveau document est édité.
- [ ] Relire les documents exportés en PDF sur écran et téléphone ; vérifier une page maximum et les retours de ligne avant usage.
- [ ] Vérifier que les compétences de l'annonce sont traitées comme des besoins de poste, sans les présenter comme des compétences du candidat sans preuve.

## Mobile et PWA

- [ ] Tester à 390 px de large : navigation, filtres, formulaire, fenêtre de lettre/CV et boutons sans débordement horizontal.
- [ ] Installer le raccourci sur iPhone et Android ; vérifier l'icône, le titre V10, la reprise hors ligne du shell et la reconnexion cloud.
- [ ] Vérifier les modales et l'impression PDF depuis Safari iOS et Chrome Android.

## Limites de la recette

Les vérifications automatisées sont des tests locaux de fumée. Elles ne valident pas encore l'authentification Supabase, la course entre deux appareils, le rendu des copies Google Docs, le format PDF ni un véritable appareil mobile. Aucune publication ou fusion n'est autorisée par cette recette.
