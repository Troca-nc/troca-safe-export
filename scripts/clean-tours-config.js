const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'frontend/src/lib/tours.config.ts')
let text = fs.readFileSync(file, 'utf8')
text = text.replace(/\uFFFD/g, '')
fs.writeFileSync(file, text, 'utf8')
