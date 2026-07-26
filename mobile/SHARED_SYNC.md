# Mobile shared-copy sync

This file tracks the manual copies that keep `mobile/` self-contained for EAS Build.
When one of the original files in `/shared` changes, copy the change here too.

| Mobile copy | Original source | Notes |
| --- | --- | --- |
| `mobile/shared-copy/categoryTaxonomy.js` | `/shared/categoryTaxonomy.js` | Category tree + taxonomy helpers |
| `mobile/shared-copy/category-icons.js` | `/shared/category-icons.js` | Category icon mapping |
| `mobile/shared-copy/categoryFields.ts` | `/shared/categoryFields.ts` | Category field definitions |
| `mobile/shared-copy/types/troc.ts` | `/shared/types/troc.ts` | Troc types shared with the mobile app |

## Sync checklist

- [ ] Copy taxonomy changes from `/shared/categoryTaxonomy.js`
- [ ] Copy icon mapping changes from `/shared/category-icons.js`
- [ ] Copy category field changes from `/shared/categoryFields.ts`
- [ ] Copy troc type changes from `/shared/types/troc.ts`
- [ ] Re-run `pnpm install --no-frozen-lockfile` in `mobile/` if lockfile-sensitive deps changed
- [ ] Re-run `npx tsc --noEmit` in `mobile/`
