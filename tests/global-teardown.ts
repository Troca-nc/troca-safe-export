import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = path.resolve(process.cwd())
const SERVER_STATE_FILE = path.join(ROOT, 'playwright', '.server.json')

export default async function globalTeardown() {
  if (!fs.existsSync(SERVER_STATE_FILE)) return

  try {
    const state = JSON.parse(fs.readFileSync(SERVER_STATE_FILE, 'utf-8')) as { pid?: number }
    if (state.pid && process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(state.pid), '/T', '/F'], { stdio: 'ignore' })
    } else if (state.pid) {
      try {
        process.kill(state.pid, 'SIGTERM')
      } catch {
        // ignore
      }
    }
  } finally {
    try {
      fs.unlinkSync(SERVER_STATE_FILE)
    } catch {
      // ignore
    }
  }
}
