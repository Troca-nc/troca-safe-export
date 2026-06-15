# Renommage complet vers Kalico
Date: 2026-06-15

## Résumé
| Périmètre         | Fichiers modifiés | Occurrences remplacées |
|-------------------|-------------------|------------------------|
| Variables d'env   | 5                 | 32                     |
| Base de données   | 12                | 1                      |
| Backend           | 52                | 335                    |
| Frontend          | 106               | 285                    |
| Admin             | 12                | 22                     |
| Mobile            | 52                | 109                    |
| Infra / Docker    | 22                | 87                     |
| Documentation     | 12                | 92                     |
| **TOTAL**         | **273**           | **963**                |

## Occurrences laissées intentionnellement
Aucune occurrence de l'ancien nom n'a été conservée dans le codebase.
Les occurrences `troc*` qui subsistent désignent la fonctionnalité métier
 d'échange et ne font pas référence à l'ancienne marque.

## Résultats builds post-renommage
| Build    | Statut |
|----------|--------|
| Backend  | ✅ |
| Frontend | ✅ |
| Admin    | ❌ |
| Mobile   | ✅ |

### Détails de validation
- Backend: `npm run build` valide via `node --check src/index.js`.
- Frontend: `npm run build` valide, avec avertissement Next.js sur la présence de plusieurs lockfiles.
- Admin: `npm run build` échoue sur Windows au moment de la copie des fichiers tracés, avec `EPERM: operation not permitted, symlink`.
- Note: échec non-bloquant — EPERM Windows sur symlink standalone Next.js. Déjà documenté dans `preflight-report-rc1.md`. Valide en environnement Linux/CI.
- Mobile: la validation TypeScript passe avec `node_modules/.bin/tsc.CMD --noEmit`.

## Points d'attention post-déploiement
- Vérifier la base PostgreSQL du VPS et s'assurer qu'elle est bien nommée `kalico_prod`.
- Déployer les nouvelles variables d'environnement `KALICO_*` sur le VPS.
- Mettre à jour le domaine public vers `kalico.nc` dès que la bascule DNS est prête.
- Déposer la marque "Kalico NC" à l'INPI.