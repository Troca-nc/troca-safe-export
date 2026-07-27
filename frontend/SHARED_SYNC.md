# Shared copy sync map

This folder contains manual copies of files that normally live in `/shared/`.
If an original changes, copy the update here too.

| Frontend copy | Original source |
| --- | --- |
| `src/shared-copy/categoryTaxonomy.js` | `/shared/categoryTaxonomy.js` |
| `src/shared-copy/category-icons.js` | `/shared/category-icons.js` |
| `src/shared-copy/categoryFields.ts` | `/shared/categoryFields.ts` |
| `src/shared-copy/types/troc.ts` | `/shared/types/troc.ts` |
| `src/shared-copy/envoi-livraisonPricing.js` | `/shared/envoi-livraisonPricing.js` |
| `src/shared-copy/fretPricing.js` | `/shared/fretPricing.js` |
| `src/shared-copy/geoData.js` | `/shared/geoData.js` |

Frontend files that now import from the local copies:

- `src/app/annonces/page.tsx`
- `src/components/PublishWizard/PublishWizard.tsx`
- `src/constants/category-icons.ts`
- `src/lib/categoryCatalog.ts`
- `src/lib/categoryPresentation.ts`
- `src/app/fret/page.tsx`
- `src/types/categoryFields.ts`
- `src/types/troc.ts`
