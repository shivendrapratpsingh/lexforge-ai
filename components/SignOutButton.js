'use client'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', color: '#5A5A5A', fontSize: 14, fontWeight: 500, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.08)'; e.target.style.color = '#EF4444' }}
      onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#5A5A5A' }}
    >
      <span>↩</span> Sign Out
    </button>
  )
}
