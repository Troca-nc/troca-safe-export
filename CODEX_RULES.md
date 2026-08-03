# Règles permanentes Codex — Kalico NC

## Encodage UTF-8 — RÈGLE CRITIQUE
Tout fichier modifié ou créé doit être sauvegardé
en UTF-8 sans BOM.

Avant de sauvegarder un fichier .tsx ou .ts :
1. Scanner toutes les strings JSX visibles pour
   détecter des séquences mojibake :
   Ã©, Ã¨, Ã , â€™, Ã‰, Å", Ã®, Ã´, Ã», â€", â€œ
2. Si détectées, les corriger avant de sauvegarder
3. Ne jamais sauvegarder un fichier avec ces séquences

## Vérification post-modification obligatoire
Après chaque modification de fichier .tsx ou .ts :
- Lancer node --check sur les fichiers backend modifiés
- Lancer npm run build dans frontend/ pour valider
- Si des mojibake sont détectés dans la sortie de build,
  les corriger avant de confirmer

## Design system
Référence : DESIGN.md à la racine du repo
Consulter avant toute modification visuelle.

## Dark mode
Toujours via html[data-theme='dark'], jamais .dark

## Textes visibles
- Zéro tiret cadratin (—) dans les textes utilisateurs
- Zéro mojibake dans les textes visibles
- Devise officielle : 
  "Nouvelle-Calédonie dans l'âme, Kalico dans la poche."
  Ne pas modifier, ne pas tronquer.
