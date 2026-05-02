'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { setLocale } from '@/app/actions/locale'
import { LANGUAGE_OPTIONS } from '@/i18n/config'

// Sidebar language switcher — segmented EN | हिं control. Writes the
// NEXT_LOCALE cookie via a server action then router.refresh() so server
// components re-render with the new messages.
export default function LanguageSwitcher() {
  const current = useLocale()
  const t = useTranslations('languageSwitcher')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function pick(code) {
    if (code === current || pending) return
    startTransition(async () => {
      await setLocale(code)
      router.refresh()
    })
  }

  return (
    <div
      title={t('tooltip')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 10px',
        marginBottom: 8,
        background: '#141414',
        border: '1px solid #2A2A2A',
        borderRadius: 10,
        opacity: pending ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <span style={{ fontSize: 11, color: '#5A5A5A', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginRight: 4 }}>
        {t('label')}
      </span>
      <div style={{ display: 'flex', flex: 1, background: '#0D0D0D', borderRadius: 6, padding: 2 }}>
        {LANGUAGE_OPTIONS.map(opt => {
          const active = opt.code === current
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => pick(opt.code)}
              disabled={pending}
              aria-pressed={active}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontSize: 12,
                fontWeight: 700,
                cursor: pending ? 'wait' : (active ? 'default' : 'pointer'),
                background: active ? 'linear-gradient(135deg, #D4A017, #B8860B)' : 'transparent',
                color: active ? '#0D0D0D' : '#9A9A9A',
                border: 'none',
                borderRadius: 5,
                transition: 'all 0.15s',
              }}
            >
              {opt.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}
