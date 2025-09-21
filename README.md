# Évite les débris - Mini jeu voiture

Un petit jeu web en HTML/CSS/JS: conduis une voiture et évite les débris sur la route.

## Lancer le jeu

- Ouvre le fichier `index.html` dans ton navigateur (double-clic).
- Contrôles:
  - Clavier: flèches gauche/droite ou A / D
  - Tactile / souris: toucher/cliquer à gauche ou à droite pour tourner, ou glisser sur le canvas

## Règles

- Évite les obstacles le plus longtemps possible.
- Le score augmente avec le temps et à chaque obstacle dépassé.
- La difficulté augmente progressivement (plus de débris, plus rapides).
- Ton meilleur score est sauvegardé dans le navigateur.

## Idées d'améliorations

- Ajouter des bonus (bouclier, ralenti, aimant à points).
- Ajouter des sons (collision, bonus, score) et une musique de fond (option couper le son).
- Système de niveaux / missions.
- Skins de voiture et types de débris.
- Mode 2 joueurs en écran partagé ou en ligne.

## Déploiement (GitHub Pages)

Le dépôt contient déjà un workflow GitHub Actions pour publier automatiquement le site sur GitHub Pages.

URL de production (Pages):

- https://spitzzy.github.io/voiture-evite-debris/

Étapes:

1. Pousser ce projet sur GitHub (branche `main`).
2. Dans GitHub → Settings → Pages, choisir "GitHub Actions" comme source.
3. Vérifier l’onglet Actions → workflow "Deploy to GitHub Pages".
4. Une fois terminé, le site est accessible à l’URL ci‑dessus.
