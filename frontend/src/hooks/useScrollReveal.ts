'use client'

import { useEffect } from 'react'

let revealObserver: IntersectionObserver | null = null
let mutationObserver: MutationObserver | null = null
let revealInitialized = false

function markRevealed(element: HTMLElement) {
  element.dataset.revealVisible = 'true'
}

function observeRevealTargets(observer: IntersectionObserver, root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-reveal="true"]').forEach((element) => {
    if (element.dataset.revealVisible === 'true') return
    observer.observe(element)
  })
}

export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || revealInitialized) return

    revealInitialized = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll<HTMLElement>('[data-reveal="true"]').forEach(markRevealed)
      return
    }

    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const element = entry.target as HTMLElement
          markRevealed(element)
          observer.unobserve(element)
        })
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    observeRevealTargets(revealObserver)

    mutationObserver = new MutationObserver((mutations) => {
      if (!revealObserver) return

      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return

          if (node.matches?.('[data-reveal="true"]')) {
            revealObserver.observe(node)
          }

          node.querySelectorAll?.('[data-reveal="true"]').forEach((element) => {
            revealObserver.observe(element)
          })
        })
      }
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      revealObserver?.disconnect()
      mutationObserver?.disconnect()
      revealObserver = null
      mutationObserver = null
      revealInitialized = false
    }
  }, [])
}
