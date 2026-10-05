import { AuthFormSkeleton } from '@/components/auth/AuthPageShell'

export default function Loading() {
  return <main className="min-h-screen bg-cream px-4 py-16 sm:px-8"><div className="mx-auto max-w-[760px]"><AuthFormSkeleton /></div></main>
}
