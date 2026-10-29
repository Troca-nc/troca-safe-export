import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../src/components/messages/MessagesPageV2.tsx', import.meta.url),
  'utf8',
)

test('le fil défile dans sa propre zone sans déplacer la page', () => {
  assert.match(source, /const messageListRef = useRef<HTMLDivElement>\(null\)/)
  assert.match(source, /<div ref=\{messageListRef\} role="log"/)
  assert.match(
    source,
    /messageList\.scrollTo\(\{ top: messageList\.scrollHeight, behavior: 'smooth' \}\)/,
  )
  assert.doesNotMatch(source, /scrollIntoView/)
})
