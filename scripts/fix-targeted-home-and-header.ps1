$ErrorActionPreference = 'Stop'

function Replace-Regex {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Pattern,
    [Parameter(Mandatory = $true)][string]$Replacement
  )

  $text = [System.IO.File]::ReadAllText($Path)
  $updated = [regex]::Replace($text, $Pattern, $Replacement)
  if ($updated -ne $text) {
    [System.IO.File]::WriteAllText($Path, $updated, [System.Text.UTF8Encoding]::new($false))
    Write-Host "$Path updated"
  }
}

Replace-Regex 'frontend/src/app/layout.tsx' '(?m)^  title: .*Petites annonces.*$' "  title: 'Kalico - Petites annonces Nouvelle-CalÃ©donie',"
Replace-Regex 'frontend/src/app/layout.tsx' '(?m)^  description: .*premi.*plateforme.*$' "  description: 'La premiÃ¨re plateforme de petites annonces dÃ©diÃ©e Ã  la Nouvelle-CalÃ©donie. Achetez, vendez, louez en toute confiance.',"
Replace-Regex 'frontend/src/app/layout.tsx' '(?m)^  keywords: .*' "  keywords: 'annonces, nouvelle-calÃ©donie, noumea, vente, achat, immobilier, vÃ©hicules',"

Replace-Regex 'frontend/src/components/layout/Header.tsx' '(?m)^    \{ href: ''/annonces/nouvelle'', icon: PlusCircle, label: .* isCta: true \},$' "    { href: '/annonces/nouvelle', icon: PlusCircle, label: 'DÃ©poser', isCta: true },"
Replace-Regex 'frontend/src/components/layout/Header.tsx' '(?m)^              D.*poser$' '              DÃ©poser'
Replace-Regex 'frontend/src/components/layout/Header.tsx' '(?m)^                          Param.*tres$' '                          ParamÃ¨tres'
Replace-Regex 'frontend/src/components/layout/Header.tsx' '(?m)^              D.*connexion$' '              DÃ©connexion'

Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  vehicules: \{ icon: Car, label: .* \},$' "  vehicules: { icon: Car, label: 'VÃ©hicules' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  ''famille-puericulture'': \{ icon: Baby, label: .* \},$' "  'famille-puericulture': { icon: Baby, label: 'Famille & PuÃ©riculture' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  ''electronique-multimedia'': \{ icon: Smartphone, label: .* \},$' "  'electronique-multimedia': { icon: Smartphone, label: 'Ã‰lectronique & MultimÃ©dia' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  ''collections-antiquites'': \{ icon: Archive, label: .* \},$' "  'collections-antiquites': { icon: Archive, label: 'Collections & AntiquitÃ©s' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  ''materiel-professionnel'': \{ icon: HardHat, label: .* \},$' "  'materiel-professionnel': { icon: HardHat, label: 'MatÃ©riel professionnel' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  location_courte_duree: \{ icon: Home, label: .* \},$' "  location_courte_duree: { icon: Home, label: 'Locations courte durÃ©e' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  electronique: \{ icon: Smartphone, label: .* \},$' "  electronique: { icon: Smartphone, label: 'Ã‰lectronique' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  \{ label: .*V.*hicules.* slug: ''vehicules'' \},$' "  { label: 'VÃ©hicules', slug: 'vehicules' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  \{ label: .*Famille .* Pu.*riculture.* slug: ''famille-puericulture'' \},$' "  { label: 'Famille & PuÃ©riculture', slug: 'famille-puericulture' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  \{ label: .*lectronique .* Multim.*dia.* slug: ''electronique-multimedia'' \},$' "  { label: 'Ã‰lectronique & MultimÃ©dia', slug: 'electronique-multimedia' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  \{ label: .*Collections .* Antiquit.*s.* slug: ''collections-antiquites'' \},$' "  { label: 'Collections & AntiquitÃ©s', slug: 'collections-antiquites' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^  \{ label: .*Mat.*riel professionnel.* slug: ''materiel-professionnel'' \},$' "  { label: 'MatÃ©riel professionnel', slug: 'materiel-professionnel' },"
Replace-Regex 'frontend/src/lib/categoryPresentation.ts' '(?m)^export const SEARCH_ALERTS = \[.*\]$' "export const SEARCH_ALERTS = ['iPhone 15', 'Toyota Hilux', 'Studio NoumÃ©a', 'CanapÃ©', 'PS5', 'Chiot']"

Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(manteaux\|vestes\|blazers\|tailleurs\|hauts\|t-shirts\|chemises\|pulls\|sweats\|robes\|jupes\|pantalons\|leggings\|shorts\|combinaisons\|lingerie\|pyjamas\|maillots de bain\|vetements de sport\|.*\)\.test\(text\)\) \{$' "  if (/(manteaux|vestes|blazers|tailleurs|hauts|t-shirts|chemises|pulls|sweats|robes|jupes|pantalons|leggings|shorts|combinaisons|lingerie|pyjamas|maillots de bain|vetements de sport|vÃªtements de sport)/.test(text)) {"
Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(sacs\|pochettes\|porte-monnaie\|portemonnaie\|trousses\|banane\|bandouliere\|.*\)\.test\(text\)\) \{$' "  if (/(sacs|pochettes|porte-monnaie|portemonnaie|trousses|banane|bandouliere|bandouliÃ¨re|sacs a main|sacs a dos|sacs de voyage|sacs de sport)/.test(text)) {"
Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(beaute\|.*\)\.test\(text\)\) \{$' "  if (/(beaute|beautÃ©|parfums|maquillage|bijoux|montres|foulards|ceintures|chapeaux|casquettes|lunettes|accessoires cheveux|accessoires de beautÃ©)/.test(text)) {"
Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(animaux\|chiens\|chats\|chevaux\|rongeurs\|adoption\|perdus\|trouves\|.*\)\.test\(text\)\) return ''paw''$' "  if (/(animaux|chiens|chats|chevaux|rongeurs|adoption|perdus|trouves|trouvÃ©s)/.test(text)) return 'paw'"
Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(services\|depannages\|demenagement\|livraison\|cours particuliers\|administratif\|garde d''enfants\|soins\|sports\|sante\|.*\)\.test\(text\)\) return ''handshake''$' "  if (/(services|depannages|demenagement|livraison|cours particuliers|administratif|garde d'enfants|soins|sports|sante|santÃ©|beaute|beautÃ©|bien-etre|bien-Ãªtre)/.test(text)) return 'handshake'"
Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(telecom\|internet\|medias\|.*\)\.test\(text\)\) return ''smartphone''$' "  if (/(telecom|internet|medias|mÃ©dias|photo|son|audio|electronique|multimedia|multimÃ©dia|smartphone|ordinateur|tv|television|tÃ©lÃ©vision)/.test(text)) return 'smartphone'"
Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(collections\|antiquites\|.*\)\.test\(text\)\) return ''gift''$' "  if (/(collections|antiquites|antiquitÃ©s)/.test(text)) return 'gift'"
Replace-Regex 'frontend/src/lib/categoryCatalog.ts' '(?m)^  if \(/\(loisirs\|musique\|lecture\|jeux\|sport\|fitness\|camping\|creatifs\|.*\)\.test\(text\)\) return ''dumbbell''$' "  if (/(loisirs|musique|lecture|jeux|sport|fitness|camping|creatifs|crÃ©atifs|modelisme|modÃ©lisme|airsoft|tir)/.test(text)) return 'dumbbell'"

Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^  return String\(listing\.commune_name \?\? listing\.commune \?\? ''''\)\.trim\(\) \|\| .*?$' '  return String(listing.commune_name ?? listing.commune ?? '').trim() || ''Nouvelle-Calédonie'''
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^            <p className=\"mt-4 max-w-2xl text-base leading-relaxed text\[#39505b\] md:text-lg dark:text-white/80\">.*</p>$' '            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#39505b] md:text-lg dark:text-white/80">Annonces, services et pros locaux partout en Nouvelle-Calédonie. De Nouméa aux Loyauté, de Koné à l&apos;île des Pins.</p>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^            <p className=\"mt-4 max-w-2xl text-base leading-relaxed text\[#39505b\] md:text-lg dark:text-white/80\">.*mots-cl.*cat.*gorie.*</p>$' '            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#39505b] md:text-lg dark:text-white/80">Les utilisateurs peuvent enregistrer des mots-clés pour suivre ce qui compte vraiment: un modèle précis, une commune, une gamme de prix ou une catégorie.</p>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^              <p className=\"mt-1 text-sm text-white/65\">.*Nouvelle-Cal.*</p>$' '              <p className="mt-1 text-sm text-white/65">État bon ou comme neuf, en Nouvelle-Calédonie</p>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^                      \{grandChildren\.length > 0 \? `\$\{grandChildren\.length\} sous-cat.*\}$' '                      {grandChildren.length > 0 ? `${grandChildren.length} sous-catégorie${grandChildren.length > 1 ? ''s'' : ''}` : ''Dernier niveau''}'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^          <h2 className=\"mt-1 font-display text-2xl font-bold text-night\">.*</h2>$' '          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les catégories que les gens cherchent vraiment</h2>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^      <span className=\"rounded-full bg-sand px-2\.5 py-1\">\{item\.commune_name \|\| item\.location_name \|\| .*</span>$' '      <span className="rounded-full bg-sand px-2.5 py-1">{item.commune_name || item.location_name || ''Nouvelle-Calédonie''}</span>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^        \{dateLabel\} .* XPF / place$' '        {dateLabel} · {timeLabel} · {item.vehicle || 'Véhicule détaillé'} · {item.price_xpf.toLocaleString('fr-FR')} XPF / place'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^              <p className="text-sm font-semibold uppercase tracking-\[0\.22em\] text-white/80">.*</p>$' '              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">Bons plans & Événements</p>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^              <h3 className="mt-1 font-display text-2xl font-bold text-white md:text-3xl">.*</h3>$' '              <h3 className="mt-1 font-display text-2xl font-bold text-white md:text-3xl">Promotions, culture et mobilité locale</h3>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">.*</p>$' '              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">Une seule vue claire pour les offres du moment, l'agenda culturel et les trajets à partager.</p>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^                <p className=\"text-sm font-semibold uppercase tracking-\[0\.22em\] text-nc-emeraude\">.*</p>$' "                <p className=\"text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude\">Promotions</p>"
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^                <h4 className=\"mt-1 text-2xl font-bold text-white\">.*</h4>$' "                <h4 className=\"mt-1 text-2xl font-bold text-white\">Les offres qui marchent maintenant</h4>"
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^                <Link href=\"/annonces/nouvelle\" className=\"text-sm font-semibold text-nc-emeraude hover:underline\">.*</Link>$' "                <Link href=\"/annonces/nouvelle\" className=\"text-sm font-semibold text-nc-emeraude hover:underline\">Ajouter la vÃ´tre</Link>"
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^              <p className=\"text-sm font-semibold uppercase tracking-\[0\.22em\] text-nc-corail\">.*</p>$' "              <p className=\"text-sm font-semibold uppercase tracking-[0.22em] text-nc-corail\">MobilitÃ©</p>"
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^              <h4 className=\"mt-1 text-2xl font-bold text-white\">Covoiturage local et interurbain</h4>$' "              <h4 className=\"mt-1 text-2xl font-bold text-white\">Covoiturage local et interurbain</h4>"
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^            Trouvez un trajet, proposez une place ou consultez les profils de confiance\. Les trajets sont.*$' "            Trouvez un trajet, proposez une place ou consultez les profils de confiance. Les trajets sont pensÃ©s pour la recherche rapide, les rÃ©servations simples et la sÃ©curitÃ© des Ã©changes."
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^  <span className=\"mb-3 text-2xl animate-pulse motion-reduce:animate-none\" aria-hidden=\"true\">.*</span>$' "  <span className=\"mb-3 text-2xl animate-pulse motion-reduce:animate-none\" aria-hidden=\"true\">ðŸŽ­</span>"
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^  <p className=\"font-display text-lg font-medium text-night dark:text-white\">.*</p>$' "  <p className=\"font-display text-lg font-medium text-night dark:text-white\">Le prochain Ã©vÃ©nement NC mÃ©rite d'Ãªtre ici.</p>"
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^  <p className="mt-2 text-sm text-\[var\(--color-text-secondary\)\]">.*</p>$' '  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Concerts, marchés, conférences - tout y est.</p>'
Replace-Regex 'frontend/src/components/home/HomeSections.tsx' '(?m)^    Cr.*er un .*v.*nement$' "    CrÃ©er un Ã©vÃ©nement"

[System.IO.File]::WriteAllText('frontend/src/components/home/HomeSections.tsx', $text, [System.Text.UTF8Encoding]::new($false))
