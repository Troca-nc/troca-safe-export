import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = (__ENV.K6_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const USERNAME = __ENV.K6_USERNAME || 'pro@demo.troca'
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
  },
}

export function setup() {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
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

  const payload = response.json()
  const accessToken = payload?.data?.access_token || payload?.access_token
  if (!accessToken) {
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
