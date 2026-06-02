import NewsletterUnsubscribeClient from './NewsletterUnsubscribeClient'

type NewsletterUnsubscribePageProps = {
  searchParams?: {
    token?: string | string[]
  }
}

function getToken(searchParams?: NewsletterUnsubscribePageProps['searchParams']) {
  const value = searchParams?.token
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

export default function NewsletterUnsubscribePage({ searchParams }: NewsletterUnsubscribePageProps) {
  return <NewsletterUnsubscribeClient token={getToken(searchParams)} />
}
