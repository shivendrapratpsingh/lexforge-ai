'use client'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      style={{
        width: '100%',
        textAlign: 'center',
        padding: '10px 14px',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.25)',
        color: '#EF4444',
        fontSize: 13,
        fontWeight: 700,
        borderRadius: 10,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        letterSpacing: '0.3px',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
    >
      <span>↩</span> Sign Out
    </button>
  )
}
