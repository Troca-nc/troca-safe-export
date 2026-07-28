'use client'

import { useTourEngine, type TourAccountType } from '@/lib/useTourEngine'

import styles from './TourPopup.module.css'

type TourPopupProps = {
  accountType?: TourAccountType
  proCategory?: string
  seenFromBackend?: string[]
}

export default function TourPopup({
  accountType = 'particulier',
  proCategory,
  seenFromBackend,
}: TourPopupProps) {
  const { isOpen, tour, step, stepIndex, totalSteps, goNext, skip } = useTourEngine({
    accountType,
    proCategory,
    seenFromBackend,
  })

  if (!isOpen || !tour || !step) return null

  const isLastStep = stepIndex === totalSteps - 1

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.active : ''}`}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={step.title}>
        <button className={styles.closeBtn} onClick={skip} aria-label="Fermer la visite guidée">
          ×
        </button>

        <div className={styles.visual}>{tour.icon}</div>

        <div className={styles.body}>
          <div className={styles.eyebrow}>{tour.eyebrow}</div>
          <div className={styles.title}>{step.title}</div>
          <div className={styles.desc}>{step.description}</div>

          <div className={styles.footer}>
            <div className={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === stepIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.skipBtn} onClick={skip}>
                Passer
              </button>
              <button className={styles.nextBtn} onClick={goNext}>
                {isLastStep ? 'Terminer' : 'Suivant'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
