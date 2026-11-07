# Terval — Game Specification

## 1. Vision

Créer un jeu web minimaliste d'entraînement auditif, inspiré du principe de reconnaissance successive.

Le joueur écoute une note jouée au-dessus d'un drone musical, puis doit identifier l'intervalle correspondant sur un cercle chromatique.

Chaque bonne réponse déclenche une animation satisfaisante et fait apparaître une nouvelle note. Une erreur termine la partie.

L'objectif est d'atteindre 20 bonnes réponses consécutives.

### Principes fondamentaux

- Sessions courtes, immédiatement accessibles.
- Reconnaissance auditive plutôt que mémorisation de séquences.
- Difficulté progressive ou libre selon le mode choisi.
- Aucune pression temporelle.
- Sound design chaleureux et contemplatif.
- Interface extrêmement simple.
- Animations organiques, fluides et satisfaisantes.

Le jeu doit être apaisant et addictif, jamais stressant.

## 2. Stack technique

- TypeScript
- Vite
- Phaser 3
- Web Audio API pour la gestion audio
- LocalStorage pour la persistance des scores

Privilégier une architecture simple, modulaire et maintenable.

Éviter les abstractions inutiles et les dépendances superflues.

Le jeu doit fonctionner dans un navigateur desktop moderne.

## 3. Boucle de jeu

### Initialisation

1. Le joueur sélectionne un niveau.
2. Une tonique est choisie aléatoirement parmi les 12 notes chromatiques.
3. La tonique est affichée clairement.
4. Un drone grave commence à jouer cette tonique.
5. Le cercle des intervalles apparaît.

### Déroulement

1. Le jeu sélectionne aléatoirement un intervalle parmi ceux autorisés par le niveau.
2. Une note correspondant à cet intervalle est jouée, au moins une octave au-dessus du drone.
3. Le joueur clique sur la position correspondante du cercle.
4. Le clic joue immédiatement la note sélectionnée.
5. Si la réponse est correcte :
   - Une animation satisfaisante confirme la réussite.
   - Le score augmente de 1.
   - Une nouvelle note est jouée après une courte transition.
6. Si la réponse est incorrecte :
   - Une animation discrète signale l'erreur.
   - La partie se termine.
   - Le score final et les records sont affichés.

Le jeu ne doit jamais imposer de limite de temps.

### Fin de partie

Le score maximum est fixé à 20.

À 20 bonnes réponses :
- Déclencher une animation spéciale de réussite.
- Afficher un état de maîtrise du niveau.
- Proposer de rejouer ou de retourner à la sélection des niveaux.

## 4. Le cercle chromatique

Le cercle est l'élément central de l'interface.

### Structure

- 12 positions fixes.
- Espacement régulier de 30 degrés.
- Une position par demi-ton chromatique.
- La position de référence (12 heures) représente l'octave.
- Les autres positions représentent les intervalles ascendants.

Noms des positions :

| Demi-tons | Intervalle |
|---:|---|
| 0 / 12 | Octave |
| 1 | Seconde mineure |
| 2 | Seconde majeure |
| 3 | Tierce mineure |
| 4 | Tierce majeure |
| 5 | Quarte juste |
| 6 | Triton |
| 7 | Quinte juste |
| 8 | Sixte mineure |
| 9 | Sixte majeure |
| 10 | Septième mineure |
| 11 | Septième majeure |

Pour le MVP, utiliser des noms d'intervalles ascendants cohérents.

### Apparence

- Les intervalles disponibles sont lumineux.
- Les intervalles indisponibles sont désactivés, avec une opacité très faible.
- Chaque position est représentée par un élément organique lumineux.
- L'élément central ou périphérique peut intégrer une légère animation de respiration.
- Lorsqu'une note est jouée, la position correspondante pulse subtilement.
- Les clics doivent être faciles à réaliser et précis.

Ne pas afficher les noms des notes chromatiques sur le cercle : uniquement les noms des intervalles.

La tonique reste affichée séparément.

## 5. Les modes de jeu

### Mode 1 : Interval Training

Mode de progression par difficulté.

Le joueur choisit librement parmi des niveaux prédéfinis. Les niveaux ne sont pas nécessairement débloqués successivement.

Proposition de répartition initiale :

1. Tierces et quinte juste.
2. Tierces, quartes et quintes.
3. Secondes, tierces, quartes et quintes.
4. Ajout des sixtes.
5. Ajout des septièmes.
6. Tous les intervalles.

Cette répartition pourra être ajustée après les premiers tests.

Chaque niveau possède :
- Son nom.
- Les intervalles disponibles.
- Le meilleur score personnel.
- Un indicateur de maîtrise lorsque le score de 20 est atteint.

### Mode 2 : Scale / Mode

Mode libre.

Le joueur sélectionne une gamme ou un mode musical.

Proposition de gammes initiales :

- Major
- Natural Minor
- Major Pentatonic
- Minor Pentatonic
- Dorian
- Mixolydian
- Phrygian

Le cercle conserve ses 12 positions, mais seules les notes appartenant à la gamme sélectionnée sont activées.

Le joueur doit identifier les intervalles correspondant aux notes de cette gamme.

Chaque combinaison gamme / mode possède son propre meilleur score.

## 6. Système de score

### Score courant

Nombre de bonnes réponses consécutives.

### Score maximum

20 réponses correctes.

Cette limite est commune à tous les niveaux et modes.

### Records personnels

Sauvegarder dans LocalStorage :
- Le meilleur score par niveau Interval Training.
- Le meilleur score par gamme / mode.
- L'état de maîtrise de chaque niveau.

Un niveau est considéré comme maîtrisé lorsque le joueur atteint 20.

Afficher un petit indicateur visuel sur les niveaux maîtrisés.

Ne pas créer de système de progression ou de récompenses complexe.

## 7. Logique musicale

Cette partie doit être particulièrement rigoureuse.

### Tonique

- Choisir aléatoirement une note parmi les 12 notes chromatiques.
- Afficher son nom international (C, C#, D, Eb, etc.).
- Conserver cette tonique pendant toute la partie.

### Drone

- Jouer la tonique dans un registre grave.
- Faire varier légèrement l'octave ou le registre du drone entre les parties.
- Conserver le drone pendant toute la partie.
- Utiliser un volume doux et une texture chaleureuse.

### Notes à identifier

- Sélectionner un intervalle parmi les intervalles autorisés.
- Calculer sa hauteur à partir de la tonique.
- Toujours jouer la note au moins une octave au-dessus du drone.
- Garder le même timbre pour toutes les notes.
- Éviter les sélections aléatoires biaisées.

### Validation

La validation doit comparer l'intervalle attendu avec la position sélectionnée, et non comparer directement les noms de notes.

Utiliser les distances chromatiques en demi-tons pour représenter les intervalles.

Pour les gammes et modes, ne sélectionner que les degrés appartenant à la gamme.

Prévoir des tests unitaires couvrant :
- Les 12 positions chromatiques.
- Les calculs d'intervalles.
- Les changements de tonique.
- Les différentes gammes et modes.
- La sélection aléatoire des notes.
- Les limites de registre.

## 8. Sound design

Le son est une composante essentielle du jeu.

L'expérience sonore doit être douce, chaleureuse et immersive.

### Instrument principal

Sonorité inspirée du handpan.

Caractéristiques recherchées :
- Attaque douce mais précise.
- Résonance métallique chaleureuse.
- Harmoniques riches.
- Sustain naturel.
- Réverbération légère.
- Absence de sons agressifs ou stridents.

Utiliser un timbre identique pour toutes les notes.

Privilégier des samples de handpan libres de droits ou des enregistrements originaux si une solution adaptée est disponible.

À défaut, créer une synthèse Web Audio additive avec plusieurs partiels résonants pour obtenir une sonorité proche du handpan.

Ne pas utiliser de samples dont la licence n'est pas vérifiée.

### Drone

- Note fondamentale grave.
- Sustain continu.
- Texture légèrement aérienne.
- Volume inférieur aux notes principales.
- Possibilité d'ajouter une harmonique très discrète.

Le drone ne doit jamais masquer les notes à identifier.

### Feedback sonore

Bonne réponse :
- Résonance douce.
- Petit accent harmonique.
- Pas de son de validation arcade classique.

Mauvaise réponse :
- Son discret, légèrement dissonant.
- Éviter les buzzers, alarmes et sons agressifs.

### Gestion audio

- Utiliser Web Audio API.
- Prévoir un système de gestion du volume.
- Prévoir un bouton mute.
- Respecter les contraintes d'autoplay des navigateurs : démarrer l'audio après une interaction utilisateur.
- Éviter les coupures brutales lors des transitions.

## 9. Direction artistique

### Concept : Zen nocturne

Une atmosphère sombre, organique, minimaliste et contemplative.

Inspirations :
- Jeux indépendants contemplatifs.
- Esthétique zen japonaise.
- Nature nocturne.
- Orbes lumineux et formes organiques.
- Lumière diffuse et particules discrètes.

### Palette

- Fond très sombre, presque noir, légèrement bleuté ou vert.
- Vert sauge.
- Jade.
- Turquoise désaturé.
- Touches de lumière chaude.

Éviter les couleurs saturées et les contrastes agressifs.

### Formes

- Orbes lumineux.
- Cercles organiques.
- Dégradés doux.
- Effets de diffusion.
- Particules très discrètes.

Pas de pixel art pour cette nouvelle expérience.

### Animations

Les animations doivent être une priorité de conception.

Prévoir notamment :

1. Apparition progressive du cercle.
2. Respiration subtile des positions actives.
3. Pulse lors de la lecture d'une note.
4. Animation de validation : expansion, halo lumineux, petites particules.
5. Transition douce vers la note suivante.
6. Animation de défaite : dissipation progressive des orbes.
7. Célébration particulière à l'atteinte de 20.

S'inspirer de la qualité des animations satisfaisantes de Balatro, sans reprendre son esthétique arcade.

Les animations doivent être fluides, naturelles et jamais envahissantes.

## 10. Interface

### Écran de sélection

Présenter les deux modes :
- Interval Training
- Scale / Mode

Afficher les niveaux disponibles et leurs meilleurs scores.

### Écran de jeu

L'écran doit rester extrêmement épuré.

Éléments :
- Nom du niveau.
- Tonique actuelle.
- Score courant / 20.
- Drone musical.
- Cercle des intervalles.

Ne pas ajouter de chronomètre, de statistiques complexes ou d'informations inutiles.

### Écran de fin

Afficher :
- Score obtenu.
- Meilleur score personnel.
- Indicateur de maîtrise si 20 atteint.
- Bouton pour rejouer.
- Bouton pour revenir à la sélection.

## 11. Architecture souhaitée

Séparer clairement :

- Le moteur de jeu.
- La logique musicale.
- La gestion audio.
- Les scènes et éléments visuels Phaser.
- La persistance des scores.

Proposition indicative :

```text
src/
  game/
    scenes/
      BootScene.ts
      MenuScene.ts
      GameScene.ts
      ResultScene.ts
    objects/
      IntervalWheel.ts
      IntervalNode.ts
    systems/
      GameController.ts
      ScoreManager.ts

  music/
    notes.ts
    intervals.ts
    scales.ts
    music-engine.ts
    audio-engine.ts

  persistence/
    score-storage.ts

  config/
    levels.ts

  main.ts
```

Cette structure est indicative : privilégier la simplicité et éviter de multiplier les fichiers sans nécessité.

La logique musicale ne doit pas dépendre de Phaser.

Le moteur audio doit être indépendant de la logique visuelle.

Prévoir une architecture permettant d'ajouter ultérieurement un mode Simon réutilisant le cercle, les intervalles et le moteur audio.

## 12. Périmètre MVP

### Inclus

- Deux modes de jeu.
- Cercle chromatique à 12 positions.
- Sélection aléatoire de la tonique.
- Drone continu.
- Timbre handpan.
- Reconnaissance successive des intervalles.
- Feedback sonore et visuel.
- Score sur 20.
- Records personnels.
- Sélection des niveaux.
- Persistance LocalStorage.

### Hors périmètre

- Mode Simon (future évolution).
- Classements en ligne.
- Comptes utilisateurs.
- Multijoueur.
- Système de récompenses complexe.
- Exercices théoriques.
- Tutoriels musicaux élaborés.
- Backend.

## 13. Priorités de réalisation

Ordre de développement recommandé :

1. Implémenter et tester la logique musicale.
2. Construire le moteur audio et valider la qualité du handpan et du drone.
3. Créer le cercle chromatique et ses interactions.
4. Implémenter la boucle de reconnaissance successive.
5. Ajouter les niveaux et les gammes / modes.
6. Ajouter les scores et la persistance.
7. Travailler les animations et la direction artistique.
8. Effectuer les tests et ajustements finaux.

Ne pas chercher à tout développer simultanément.

Valider la qualité de l'expérience audio et de la mécanique avant de consacrer trop de temps aux détails visuels.

## 14. Critères de qualité

Le résultat final doit donner envie de lancer une partie de quelques minutes régulièrement.

Les trois critères les plus importants sont :

1. **Qualité sonore :** le handpan et le drone doivent être agréables à écouter, même pendant plusieurs minutes.
2. **Satisfaction :** chaque bonne réponse doit procurer une petite sensation de réussite.
3. **Simplicité :** le joueur doit comprendre immédiatement ce qu'il doit faire.

Privilégier une expérience cohérente, soignée et minimaliste plutôt qu'une accumulation de fonctionnalités.