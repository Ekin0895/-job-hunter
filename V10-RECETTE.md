# Recette V10 — synchronisation et documents

> La V10 est une branche de développement. Ne pas fusionner avec `main` tant que les scénarios ci-dessous ne sont pas validés.

## Préparation
1. Depuis la V9 publique, exporter un JSON de sauvegarde.
2. Utiliser un compte Supabase de test ou des candidatures fictives, jamais une vraie candidature pour tester les suppressions.
3. Vérifier que `job_hunter_save` et `job_hunter_delete` existent dans Supabase.
4. Ouvrir une version de test V10 sur deux navigateurs/appareils différents (ne pas confondre avec l'URL V9).

## Scénarios obligatoires
- [ ] Se connecter : retrouver exactement les offres du cloud.
- [ ] Ajouter une offre fictive A sur Mac, vérifier qu'elle arrive sur iPhone après actualisation.
- [ ] Modifier A sur iPhone, puis tenter de sauvegarder une version ancienne sur Mac : la modification iPhone doit être préservée et le conflit signalé.
- [ ] Supprimer A sur iPhone, puis tenter de modifier A depuis une version ancienne sur Mac : aucune résurrection silencieuse.
- [ ] Modifier A sur Mac, puis tenter une suppression depuis un iPhone non actualisé : suppression refusée.
- [ ] Supprimer une offre fictive : confirmation explicite, suppression sur les deux appareils.
- [ ] Couper le réseau au milieu d'une sauvegarde : les données locales doivent rester disponibles et exportables.
- [ ] Importer deux fois le même JSON : pas de doublons ajoutés.
- [ ] Modifier une lettre déjà validée : sa validation doit repasser à « Non ».
- [ ] Copier le modèle Google Docs marketing et commercial : vérifier que les originaux ne changent pas.
- [ ] Exporter une lettre en PDF : vérifier manuellement qu'elle tient sur une page.
- [ ] Tester navigation, formulaires, filtres et installation PWA sur mobile.

## Contrôle de version
La V10 utilise `updated_at` comme version opaque : elle envoie exactement l'horodatage renvoyé par le serveur, sans conversion locale. Les RPC Supabase vérifient la version sous verrou avant écriture ou suppression.

**Limite importante :** le déclencheur existant `set_job_offer_updated_at` est présent et modifie `NEW.updated_at`, mais son code complet n'a pas été inspecté. Vérifier qu'il produit une valeur strictement croissante, notamment si plusieurs écritures sont très rapprochées. Ne pas prétendre à une garantie absolue avant ce contrôle.

## Périmètre non livré
- Génération automatique de CV directement dans les copies Google Docs.
- Vérification automatique de la pagination des documents.
- Tests d'intégration Supabase et navigateur exécutés.
- Publication en production (nécessite accord explicite).
