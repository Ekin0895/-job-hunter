# Essayer Job Hunter V10 sans toucher à la V9

Cette procédure lance la V10 **sur ton Mac uniquement**. Elle ne publie pas le site et ne modifie pas la branche `main`.

## Démarrage (Mac)

1. Ouvre [la branche V10](https://github.com/Ekin0895/-job-hunter/tree/develop/job-hunter-v10).
2. Clique sur **Code → Download ZIP**, puis décompresse le ZIP.
3. Ouvre l'application **Terminal** sur le Mac.
4. Tape `cd ` (avec un espace), glisse le dossier décompressé dans le Terminal, puis appuie sur Entrée.
5. Tape `python3 -m http.server 8765` et appuie sur Entrée.
6. Ouvre **http://localhost:8765/** dans Safari ou Chrome. Laisse le Terminal ouvert pendant l'essai.

Tu peux utiliser l'interface et tester l'ajout d'une offre **sans te connecter au cloud**. Les données de ce test local restent propres à ce navigateur et à cette origine.

## Important avant de connecter Supabase

- Exporte d'abord les candidatures existantes depuis ton application habituelle (V9) en JSON.
- **Ne teste pas les suppressions avec ton compte Supabase réel** : V10 peut accéder aux mêmes données que V9.
- La synchronisation V10 requiert les fonctions SQL du dossier `supabase/`, à comparer avec la base avant exécution.
- Les brouillons CV et lettres ne sont **pas** des Google Docs finalisés automatiquement : il faut copier le modèle, coller et relire le résultat.

## Essai minimal

1. Ajoute une offre fictive de test clairement identifiée « TEST V10 » sans l'envoyer au cloud.
2. Modifie son statut puis recharge la page : elle doit être conservée.
3. Prépare un brouillon de CV et une lettre, enregistre-les et recharge la page.
4. Exporte les données en JSON.
5. Vérifie l'affichage de la fiche sur une fenêtre étroite.

Pour arrêter le serveur local, reviens au Terminal et appuie sur **Ctrl+C**.

## Limites

Ce test local ne prouve pas la synchronisation multi-appareils, l'authentification Supabase, ni la pagination d'un PDF Google Docs. Ces points doivent être validés séparément avant la publication.
