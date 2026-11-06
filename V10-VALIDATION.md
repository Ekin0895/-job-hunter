# Job Hunter V10 — journal de validation

> Branche de développement uniquement. Ne pas fusionner vers `main` avant validation sur Mac et iPhone.

## Modifications intégrées

- Cache du service worker séparé pour V10.
- Contrôle préalable des conflits entre la copie locale et Supabase avant les écritures.
- Sauvegarde locale en cas de conflit ; la vérification n'est **pas atomique** et ne remplace pas une transaction serveur.
- Confirmation avant suppression distante.
- Détection des offres similaires (URL normalisée ou entreprise + intitulé).
- Contrôle des champs obligatoires et des URL.
- Statut explicite des documents : lien renseigné ≠ document vérifié.

## Contrôles réalisés

- Vérification de la syntaxe du script principal : OK après correction.
- Contrôle fonctionnel de la normalisation du texte : OK.
- Vérification de l'existence des fichiers `index.html`, `sw.js` et `manifest.webmanifest` sur la branche : OK.
- **Non validés** : parcours complet en navigateur, authentification Supabase, tests simultanés Mac/iPhone, génération de PDF, conservation exacte des trois modèles de CV, automatisation des imports.

## Scénarios à exécuter avant publication

1. Exporter les données depuis la V9 et vérifier que le JSON contient les cinq offres.
2. Sur un environnement de test, ajouter une offre, recharger, puis confirmer qu'elle persiste.
3. Coller deux fois la même annonce avec des paramètres de suivi différents : vérifier l'alerte de doublon.
4. Sur deux appareils, modifier simultanément la même offre : vérifier le blocage du conflit et la sauvegarde locale.
5. Sur deux appareils, ajouter deux offres différentes : vérifier qu'aucune n'est perdue.
6. Supprimer une offre puis annuler la confirmation cloud : vérifier qu'elle reste disponible.
7. Vérifier qu'un lien de CV non contrôlé n'est jamais présenté comme un document finalisé.
8. Vérifier chaque CV et chaque lettre à **une page maximum** dans le PDF exporté.
9. Contrôler les affichages mobiles, l'installation PWA et le comportement hors ligne.
10. Publier sur `main` uniquement après accord explicite.

## Limites et sécurité

La pré-vérification des conflits peut encore subir une course entre la lecture et l'écriture : une vraie protection exige un contrôle de version transactionnel côté Supabase (RPC / CAS). Les URL de candidature doivent être vérifiées sur la source officielle ; un lien ancien peut désigner une autre annonce. Aucun envoi de candidature ne doit être automatisé sans validation explicite.

## Mise à jour — développement V10

- Protection supplémentaire contre le remplacement d'éditions locales lors d'une actualisation ou connexion cloud en cours.
- Copies immuables des données utilisées pour les écritures distantes.
- Gestion plus sûre des succès partiels : chaque suppression cloud réussie met à jour le snapshot immédiatement ; les suppressions ciblent aussi `user_id`.
- Détection et avertissement sur l'ancien lien Klox incompatible avec le poste SEO/GEO.
- Brouillons de lettres par catégorie, à relire et personnaliser ; indicateur de longueur (pas une garantie de pagination).
- Validation manuelle CV/lettre sur une page ; invalidation de la validation après modification du document.
- Copie native de deux modèles Google Docs (Marketing/Klox et Commercial/Happypal). **L'application ne modifie pas automatiquement le contenu de ces copies.**
- Tests automatisés ajoutés dans `tests/smoke.mjs` et workflow `.github/workflows/v10-smoke.yml`.

### Bloquants avant livraison complète

1. La création automatique de CV fidèles aux modèles Google Docs exige un mécanisme d'autorisation Google côté utilisateur et une implémentation de l'édition de copies. Les liens `/copy` restent une solution manuelle.
2. La protection cloud n'est pas transactionnelle côté Supabase : prévoir une fonction SQL/RPC avec contrôle de version avant toute promesse de synchronisation sans perte.
3. Les tests automatisés actuels sont des tests de fumée, pas des tests navigateur ou d'intégration cloud. Vérifier leur exécution dans GitHub Actions.
4. Les modèles CV administratifs ne sont pas encore connectés à un document Google Docs vérifié.
5. Ne pas fusionner vers `main` sans validation de l'utilisateur.
