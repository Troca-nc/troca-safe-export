import { http, HttpResponse } from 'msw'

export const mswHandlers = [
  http.get('/api/search/suggestions', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''

    return HttpResponse.json({
      data: {
        suggestions: query
          ? [query, `${query} NC`, `${query} occasion`]
          : ['Toyota Hilux', 'iPhone', 'Nouméa'],
      },
    })
  }),
  http.post('/api/newsletter/subscribe', async () => {
    return HttpResponse.json({ data: { ok: true } }, { status: 201 })
  }),
]
