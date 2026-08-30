import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = (__ENV.K6_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
// Origin only (no /api suffix). Default preserves same-origin deployments.
const API_BASE_URL = (__ENV.K6_API_BASE_URL || BASE_URL).replace(/\/$/, '')
const USERNAME = __ENV.K6_USERNAME || 'pro@demo.kalico'
const PASSWORD = __ENV.K6_PASSWORD || 'Demo1234!'

export const options = {
  scenarios: {
    critical_routes: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1200'],
    'http_req_duration{name:home}': ['p(95)<1200'],
    'http_req_duration{name:pro-dashboard}': ['p(95)<1200'],
    'http_req_duration{name:checkout}': ['p(95)<1200'],
  },
}

export function setup() {
  const response = http.post(
    `${API_BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: USERNAME,
      password: PASSWORD,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'login' },
    }
  )

  check(response, {
    'login status is 200': (r) => r.status === 200,
  })

  if (response.status !== 200) {
    throw new Error(`Login failed: expected HTTP 200, received ${response.status}`)
  }
  const contentType = response.headers['Content-Type'] || response.headers['content-type'] || ''
  if (!/application\/(?:[\w.+-]+\+)?json\b/i.test(contentType)) {
    throw new Error('Login failed: expected a JSON response; check K6_API_BASE_URL')
  }
  let payload
  try {
    payload = response.json()
  } catch {
    // Do not expose response bodies, credentials or tokens in CI logs.
    throw new Error('Login failed: invalid JSON response')
  }
  const accessToken = payload?.data?.access_token || payload?.access_token
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Access token missing from login response')
  }

  return { accessToken }
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.accessToken}`,
  }

  const responses = http.batch([
    ['GET', `${BASE_URL}/`, null, { tags: { name: 'home' } }],
    ['GET', `${BASE_URL}/pro/dashboard`, null, { headers, tags: { name: 'pro-dashboard' } }],
    ['GET', `${BASE_URL}/abonnement`, null, { headers, tags: { name: 'checkout' } }],
  ])

  check(responses[0], { 'home is healthy': (r) => r.status === 200 })
  check(responses[1], { 'dashboard is reachable': (r) => r.status === 200 || r.status === 302 })
  check(responses[2], { 'checkout page is reachable': (r) => r.status === 200 || r.status === 302 })

  sleep(1)
}
