import ConnexionClient from './ConnexionClient'

type SearchParams = {
  next?: string | string[]
  redirect?: string | string[]
  returnUrl?: string | string[]
  email?: string | string[]
  verified?: string | string[]
}

type PageProps = {
  searchParams?: Promise<SearchParams>
}

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function ConnexionPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const nextPath =
    firstValue(resolvedSearchParams?.next) ||
    firstValue(resolvedSearchParams?.redirect) ||
    firstValue(resolvedSearchParams?.returnUrl) ||
    ''

  return (
    <ConnexionClient
      nextPath={nextPath}
      initialEmail={firstValue(resolvedSearchParams?.email)}
      emailVerified={firstValue(resolvedSearchParams?.verified) === '1'}
    />
  )
}
