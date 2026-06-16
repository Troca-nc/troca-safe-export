'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, Loader2, ScanSearch, Ticket } from 'lucide-react'
import jsQR from 'jsqr'

import Header from '@/components/layout/Header'

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('En attente de la caméra...')
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrame = 0
    let active = true

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!active) return

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setIsScanning(true)
        setStatus('Scannez un QR code Kalico.')

        const loop = () => {
          if (!active) return
          const canvas = canvasRef.current
          const context = canvas?.getContext('2d')
          if (!video || !canvas || !context || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animationFrame = window.requestAnimationFrame(loop)
            return
          }

          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code?.data) {
            try {
              const url = new URL(code.data)
              const match = url.pathname.match(/\/scan\/([^/]+)/)
              if (match?.[1]) {
                window.location.assign(`/scan/${encodeURIComponent(match[1])}`)
                return
              }
            } catch {
              const match = String(code.data).match(/KAL-[a-f0-9]{32}/i)
              if (match?.[0]) {
                window.location.assign(`/scan/${encodeURIComponent(match[0])}`)
                return
              }
            }
          }

          animationFrame = window.requestAnimationFrame(loop)
        }

        animationFrame = window.requestAnimationFrame(loop)
      } catch (err: any) {
        setError(err?.message || 'Impossible d’accéder à la caméra.')
      }
    }

    void start()
    return () => {
      active = false
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <p className="inline-flex items-center gap-2 rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">
            <ScanSearch className="h-3.5 w-3.5" />
            Scanner de billets
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-night">Scanner un QR Kalico</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-night/65">
            Pointez la caméra vers le QR code généré par la billetterie native pour ouvrir la fiche du billet.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-black">
              <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <aside className="space-y-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
              <div className="flex items-center gap-3">
                {isScanning ? <Camera className="h-5 w-5 text-[#0A7EA4]" /> : <Loader2 className="h-5 w-5 animate-spin text-[#0A7EA4]" />}
                <div>
                  <p className="text-sm font-semibold text-night">État</p>
                  <p className="text-sm text-night/60">{status}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white p-4">
                <p className="text-sm font-semibold text-night">Conseils</p>
                <ul className="mt-2 space-y-2 text-sm text-night/65">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Gardez le QR bien au centre.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> La lumière doit être suffisante.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Le QR peut aussi être saisi manuellement.</li>
                </ul>
              </div>

              <Link href="/scan" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-night">
                <Ticket className="h-4 w-4" />
                Scanner un autre billet
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
