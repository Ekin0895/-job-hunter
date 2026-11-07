# Job Hunter — parcours Work / Google

Interface indépendante dans `work/`, publiée sur le Site privé existant. La V9 et `main` sont conservés.

## Fonctionnement

Work prépare les offres et les documents dans Google Drive ; Google Sheets reste le registre privé. L’application lit ce registre et enregistre les changements ciblés après vérification et relecture. Aucun abonnement ni API d’IA payante n’est ajouté.

Trois parcours : Marketing, Commercial, Administratif / Polyvalent. La catégorie est modifiable. Les seuils de salaire marketing ne sont pas imposés aux autres parcours.

- À postuler : dossiers préparés encore à analyser, relire ou envoyer.
- Suivi : candidatures envoyées et entretiens ; filtres pour clôturées, anciennes offres ou tout l’historique.
- Aujourd’hui : relectures, relances arrivées à échéance et entretiens à sept jours.
- Favoris : étoiles persistées dans le tableau.
- Détail : documents Google, PDF datés, déclaration « J’ai postulé », dates et notes, exclusion motivée et réintégration.
- Entretien : guide de 30 minutes construit localement à partir des missions et de preuves professionnelles validées. Questions par métier, pistes à personnaliser, copie et téléchargement texte. Il ne s’agit pas d’une rédaction IA autonome de réponses complètes.

« J’ai postulé » enregistre une déclaration, la date et une suggestion de relance à J+7. Aucun message ni candidature n’est envoyé. Une ancienne ligne est reprise avec le même identifiant dans le registre central à la première modification ; l’onglet historique original reste intact.

## Schéma et sécurité

Colonnes A:AD conservées ; extension AE:AM : Catégorie, Favori, Écartée, Motif d’exclusion, PDF CV, PDF lettre, Date entretien, PDF générés le, Notes personnelles. Le schéma est validé avant écriture. Les conflits visibles sont refusés ; chaque mutation est relue, sans répétition automatique après timeout. Ce mécanisme n’est pas une transaction atomique Google Sheets.

Le jeton Google est conservé uniquement en mémoire. Une reconnexion peut être nécessaire après fermeture ou expiration. Le client OAuth et le tableau préconfigurés évitent leur ressaisie. Le dépôt public ne contient pas les paramètres privés ni les preuves du profil ; ils sont fournis par le déploiement privé.

Les PDF privés sont des instantanés datés, à régénérer après modification des Google Docs. Le téléchargement peut demander la connexion Google. L’import d’annonce copie une demande à transmettre dans Work : aucun agent distant n’est déclenché par le bouton.

## Vérification

```sh
node --check work/app.mjs
node --test tests/workflow-actions.test.mjs tests/work-app.test.mjs tests/workflow-core.test.mjs tests/insights.test.mjs
```

26 tests passent : sécurité et liens réels, schéma et doublons, conflits et relecture, trois parcours, séparation des vues, dates Paris et changements d’heure, favoris, promotion d’historique, téléchargements PDF et guide d’entretien sans faits inventés. Ces tests utilisent aussi des réponses simulées et ne prouvent pas à eux seuls les autorisations distantes.

Lecture et changement de statut réels déjà vérifiés depuis le Site ; trois dossiers supplémentaires présents le 7 novembre après l’exécution programmée. L’historique est préservé. Le journal de la tâche détaille ses propres contrôles documentaires. Une exécution réussie ne garantit pas toutes les exécutions futures ni une livraison exactement à 8 h.

Les tests Safari sur iPhone physique restent distincts des contrôles responsive à 390 px. Les anciens tests V10 sont indépendants ; aucune réparation générale de V10 n’est annoncée.

## Installation et présentation

Publier tout `work/`, modules, manifeste et `assets/` inclus. Origine HTTPS autorisée par le client OAuth Google, scope `spreadsheets`. Le mode `?demo=1` utilise uniquement des fiches fictives et des modifications en mémoire.

Palette bleu nuit / menthe, icône originale J, graphiques tirés des données réelles. Les graphiques fusionnent historique et sélection sans doublons ; la disponibilité documentaire ne certifie pas la validation. Logos officiels locaux avec provenance dans `assets/SOURCES.md`, initiales en secours. Aucun service tiers de logos ne reçoit les entreprises consultées.

Contrôles navigateur de la version publiée : sur une copie privée du registre, favoris écrits et relus ; déclaration de candidature avec date et relance J+7 ; exclusion puis réintégration ; reprise d’une ancienne offre sans doublon ni changement de l’onglet source. Fiche d’entretien affichée, copiée et téléchargée. PDF d’un CV récupéré via son bouton et signature `%PDF-` vérifiée. Le clic avec ouverture dans un nouvel onglet n’a pas fourni d’événement de téléchargement au contrôleur ; le téléchargement du lien a, lui, fourni un vrai fichier. Le comportement Safari reste à confirmer.

## Ergonomie, critères et rangement — 7 novembre 2026

Boutons distincts Modifier/Télécharger pour CV et lettre sur chaque carte et dans le détail. Modifier ouvre le Google Doc ; Télécharger utilise l’export PDF actuel de ce Doc, les instantanés Drive restant conservés. Après une édition personnelle, contrôler de nouveau pagination et contenu ; aucune ancienne validation n’atteste la nouvelle version.

Les critères par parcours sont enregistrés dans Recherche A:D, les demandes manuelles dans Imports A:H, les logos publics vérifiés dans Logos A:D. Ces onglets techniques sont masqués, les données restent privées dans le tableau. Le schéma des candidatures A:AM reste inchangé. Choix multiples de contrats, métiers, zones et niveaux ; minimum/cible et télétravail séparés ; week-end et management explicites. Sauvegarde avec contrôle de version et relecture. La tâche existante a été mise à jour pour lire ces valeurs et la file à sa prochaine exécution, sans nouvelle automatisation. Le prochain traitement programmé avec ces nouveaux critères reste à observer.

Une annonce ajoutée est une demande en attente, pas une extraction ni une génération immédiate. Le collage facultatif du texte contourne l’indisponibilité d’un contenu de lien sans contourner les protections de plateforme. Le bouton de traitement immédiat copie la demande à transmettre dans Work. Une connexion Google est nécessaire pour sauvegarder dans le tableau. La vue À postuler présente les dossiers avec CV et lettre ; les lignes incomplètes restent accessibles dans Suivi → Toutes les offres conservées.

Les six dossiers actuels sont regroupés dans un dossier Drive dédié avec un sous-dossier par candidature, 2 Docs et 2 PDF chacun. Aucun original, historique ni lien de document n’a changé. Les Récents Google Docs peuvent toujours les afficher.

Safe areas iOS : marge haute env(safe-area-inset-top) +12px, marges latérales et barre inférieure adaptées. Le test responsive ne remplace pas une vérification sur iPhone physique.

Logos officiels locaux pour les six dossiers préparés, registre extensible par Work pour les futurs dossiers. Logos des cabinets clairement identifiés si client confidentiel. Les autres entreprises inconnues affichent un pictogramme sans initiales ; aucun faux logo n’est créé. La connexion durable Google et les notifications Web Push ne sont pas mises en place : l’app statique actuelle n’a pas de serveur de renouvellement Google ni d’envoi push. Les notifications ChatGPT de la tâche dépendent des réglages de l’utilisateur.

Validation de cette évolution : 34 tests passent. Sur la copie privée, CDI + CDD et minimum36000 enregistrés et relus dans Recherche ; une demande LinkedIn inscrite et relue dans Imports ; doublon refusé sans deuxième ligne. Téléchargement de CV et lettre via export Google Docs : signatures PDF vérifiées ; CV A4 une page. Les critères du tableau principal sont conservés à leurs valeurs initiales.

## Messages de relance

Dans un dossier envoyé ou en entretien, Préparer une relance ouvre un brouillon modifiable, avec objet et message à copier séparément. Étapes Après candidature et Après un entretien déjà réalisé ; le second cas est un choix explicite, jamais déduit d’un simple statut RH. Seules les dates connues et non futures sont reprises. Une mission réellement enregistrée contextualise le texte, sans résultats ni compétences inventés. Nom du contact facultatif ; aucun destinataire ni adresse deviné. Le texte modifié reste dans la fenêtre, aucun envoi ni écriture Google n’est déclenché. Aujourd’hui → relance échue ouvre directement ce brouillon.


### Contacts LinkedIn et relances
L'onglet privé Contacts (A:I) associe chaque candidature à un profil LinkedIn sourcé, un rôle, un niveau de certitude, une justification et une date de recherche. L'application affiche ces informations dans la fiche et le brouillon de relance. La présence dans une équipe ne prouve pas l'attribution du dossier : les relais restent explicitement à confirmer. Aucun lien n'est inventé et une absence de contact est affichée honnêtement. Les profils invalides, les sources absentes et les identifiants en doublon bloquent la suggestion.
Les messages de relance sont modifiables puis copiables ; aucun envoi, aucune modification de statut ni aucune date inventée. Le choix après-entretien reste explicite.
Tests : `node --test tests/*.test.mjs`.
