const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'frontend/src/app/connexion/ConnexionClient.tsx')
let text = fs.readFileSync(file, 'utf8')
text = text.replace(/^\s*placeholder="+"$/m, '                    placeholder=""')
fs.writeFileSync(file, text, 'utf8')
