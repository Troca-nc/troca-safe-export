import Header from '@/components/layout/Header'
import { Skeleton } from '@/components/ui/Skeleton'

export default function LoadingListingDetail() {
  return <><Header /><main className="mx-auto max-w-container px-4 pb-20 pt-8 sm:px-6 lg:px-12"><Skeleton className="mb-6 h-4 w-64" /><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_396px]"><div className="space-y-6"><Skeleton className="aspect-[16/10] rounded-block" /><Skeleton className="h-56 rounded-block" /><div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-card" />)}</div></div><Skeleton className="h-96 rounded-block" /></div></main></>
}
