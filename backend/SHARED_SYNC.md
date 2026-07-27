# Shared copy sync map

This folder contains manual copies of files that normally live in `/shared/`.
If an original changes, copy the update here too.

| Backend copy | Original source |
| --- | --- |
| `src/shared-copy/categoryTaxonomy.js` | `/shared/categoryTaxonomy.js` |
| `src/shared-copy/geoData.js` | `/shared/geoData.js` |
| `src/shared-copy/routesNC.js` | `/shared/routesNC.js` |
| `src/shared-copy/fretPricing.js` | `/shared/fretPricing.js` |
| `src/shared-copy/envoi-livraisonPricing.js` | `/shared/envoi-livraisonPricing.js` |

Backend files updated to use the local copies:

- `src/routes/communes.js`
- `src/routes/covoiturage.route.js`
- `src/routes/pro.products.js`
- `src/scripts/seedCategories.js`
- `src/services/demoSeedService.js`
- `src/services/fretWorkflowService.js`
- `src/services/importService.js`
- `src/services/quoteRequestService.js`
