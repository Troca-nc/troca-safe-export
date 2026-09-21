// Dette historique introduite par les reconversions d405ae9 et fe407ca.
// Les fichiers restaurés deviennent bloquants ; les autres restent signalés
// jusqu'à leur correction progressive.

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src')
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx'])
const GUARDED_FILES = new Set([
  'frontend/src/app/abonnement/confirmation/page.tsx',
  'frontend/src/app/abonnement/page.tsx',
  'frontend/src/app/annonces/[id]/page.tsx',
  'frontend/src/app/annonces/page.tsx',
  'frontend/src/app/annonces/preview/page.tsx',
  'frontend/src/app/bienvenue/page.tsx',
  'frontend/src/app/connexion/ConnexionClient.tsx',
  'frontend/src/app/cgu/page.tsx',
  'frontend/src/app/cgv/page.tsx',
  'frontend/src/app/inscription/page.tsx',
  'frontend/src/app/inscription/telephone/page.tsx',
  'frontend/src/app/mentions-legales/page.tsx',
  'frontend/src/app/mot-de-passe-oublie/page.tsx',
  'frontend/src/app/mot-de-passe-oublie/reset/page.tsx',
  'frontend/src/app/notifications/page.tsx',
  'frontend/src/app/paiement/annule/page.tsx',
  'frontend/src/app/paiement/succes/page.tsx',
  'frontend/src/app/parametres/notifications/page.tsx',
  'frontend/src/app/parametres/page.tsx',
  'frontend/src/app/politique-cookies/page.tsx',
  'frontend/src/app/politique-de-confidentialite/page.tsx',
  'frontend/src/app/profil/[id]/page.tsx',
  'frontend/src/app/profil/alertes-trajet/page.tsx',
  'frontend/src/app/profil/page.tsx',
  'frontend/src/app/verification-email/page.tsx',
  'frontend/src/components/PaymentFailureBanner.tsx',
  'frontend/src/components/DemoBanner.tsx',
  'frontend/src/components/DemoModeNotice.tsx',
  'frontend/src/components/auth/AuthMapPanel.tsx',
  'frontend/src/components/auth/AuthRequiredModal.tsx',
  'frontend/src/components/auth/SocialAuthButtons.tsx',
  'frontend/src/components/auth/TurnstileChallenge.tsx',
  'frontend/src/components/annonces/AnnonceSimilaires.tsx',
  'frontend/src/components/annonces/AnnoncesMap.tsx',
  'frontend/src/components/annonces/CategoryFields.tsx',
  'frontend/src/components/annonces/ListingCoachCard.tsx',
  'frontend/src/components/annonces/ShareButton.tsx',
  'frontend/src/components/annonces/ShareFloating.tsx',
  'frontend/src/components/annonces/SaveSearchAlert.tsx',
  'frontend/src/components/messages/ChatInput.tsx',
  'frontend/src/components/messages/ConversationList.tsx',
  'frontend/src/components/messages/MessageBubble.tsx',
  'frontend/src/components/messages/MessagesPage.tsx',
  'frontend/src/components/listings/CategoryFeedPage.tsx',
  'frontend/src/components/listings/ListingCard.tsx',
  'frontend/src/components/monetisation/PaymentProviderSelector.tsx',
  'frontend/src/components/onboarding/ContextualTooltips.tsx',
  'frontend/src/components/onboarding/OnboardingChecklist.tsx',
  'frontend/src/components/onboarding/OnboardingToast.tsx',
  'frontend/src/components/onboarding/WelcomeToast.tsx',
  'frontend/src/components/profil/AlertsManager.tsx',
  'frontend/src/components/profil/PhoneVerification.tsx',
  'frontend/src/components/profil/SellerStatsDashboard.tsx',
  'frontend/src/components/profil/TrustBadge.tsx',
  'frontend/src/components/ui/DemoModeSwitcher.tsx',
  'frontend/src/components/ui/NotificationBell.tsx',
  'frontend/src/components/ui/ProfileDemoPreview.tsx',
  'frontend/src/hooks/usePayment.ts',
  'frontend/src/lib/demoMode.ts',
  'frontend/src/hooks/usePhoneVerification.ts',
  'frontend/src/hooks/useMessaging.ts',
  'frontend/src/types/messaging.types.ts',
])

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, files)
    } else if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }
  return files
}

function detectIssues(buffer) {
  const issues = []

  if (buffer.includes(0)) {
    issues.push('NUL byte')
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    issues.push('UTF-16 LE BOM')
  }

  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    issues.push('UTF-8 BOM')
  }

  if (buffer.includes(Buffer.from([0xef, 0xbf, 0xbd]))) {
    issues.push('U+FFFD replacement character')
  }

  if (buffer.includes(Buffer.from([0xc3, 0xaf, 0xc2, 0xbf, 0xc2, 0xbd]))) {
    issues.push('Mojibake ï¿½ (double-encoded U+FFFD)')
  }

  return issues
}

const suspectFiles = walk(FRONTEND_SRC).reduce((acc, file) => {
  const buffer = fs.readFileSync(file)
  const issues = detectIssues(buffer)
  if (issues.length) {
    acc.push({ file, issues })
  }
  return acc
}, [])

const guardedIssues = suspectFiles.filter(({ file }) => {
  const relativePath = path.relative(ROOT, file).split(path.sep).join('/')
  return GUARDED_FILES.has(relativePath)
})

if (suspectFiles.length) {
  console.error('Encoding issues detected:')
  for (const item of suspectFiles) {
    console.error(`- ${path.relative(ROOT, item.file)}: ${item.issues.join(', ')}`)
  }
} else {
  console.log('No encoding issues detected.')
}

if (guardedIssues.length) {
  console.error('Encoding regression detected in a guarded file.')
  process.exitCode = 1
} else {
  console.log(`${GUARDED_FILES.size} guarded files are free of known encoding issues.`)
}
