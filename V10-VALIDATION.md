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
