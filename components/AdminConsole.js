'use client'

import { useEffect, useState } from 'react'
import AdminInstitutions from './AdminInstitutions'
import AdminCosts from './AdminCosts'

const CARD = {
  background: '#141414',
  border: '1px solid #1C1C1C',
  borderRadius: 12,
  padding: 18,
}

const LABEL = { fontSize: 11, color: '#6A6A6A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }
const VALUE = { fontSize: 26, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }

const TH = { textAlign: 'left', fontSize: 11, color: '#6A6A6A', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', padding: '10px 12px', borderBottom: '1px solid #1C1C1C' }
const TD = { padding: '12px', fontSize: 13, color: '#C0C0C0', borderBottom: '1px solid #141414' }

function Btn({ children, onClick, color = '#D4A017', disabled, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        borderRadius: 8,
        border: `1px solid ${danger ? '#802020' : color}`,
        background: danger ? 'rgba(150,30,30,0.12)' : 'rgba(212,160,23,0.08)',
        color: danger ? '#F48080' : color,
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function Badge({ children, color }) {
  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: 6,
      background: `${color}22`,
      color,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  )
}

// Helper: format a Date or ISO string for an <input type="datetime-local">.
function toLocalInput(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function fmtRange(startsAt, endsAt) {
  const s = new Date(startsAt), e = new Date(endsAt)
  const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return `${s.toLocaleString(undefined, opts)} → ${e.toLocaleString(undefined, opts)}`
}

function statusColor(status) {
  if (status === 'active')   return '#4ADE80'
  if (status === 'upcoming') return '#60A5FA'
  return '#6A6A6A' // expired
}

const INPUT = {
  background: '#0D0D0D',
  border: '1px solid #1C1C1C',
  borderRadius: 8,
  padding: '8px 10px',
  color: '#F0F0F0',
  fontSize: 13,
  outline: 'none',
}
const FIELD_LABEL = { fontSize: 10, color: '#6A6A6A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }

export default function AdminConsole() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [drafts, setDrafts] = useState([])
  const [globalPromo, setGlobalPromo] = useState(null)
  const [emailPromos, setEmailPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState({})
  const [err, setErr] = useState(null)

  // Global promo form state
  const [gpStart, setGpStart] = useState('')
  const [gpEnd,   setGpEnd]   = useState('')
  const [gpNote,  setGpNote]  = useState('')

  // Email promo form state
  const [epEmail, setEpEmail] = useState('')
  const [epStart, setEpStart] = useState('')
  const [epEnd,   setEpEnd]   = useState('')
  const [epNote,  setEpNote]  = useState('')

  // System settings (Pro toggle + free quota) state
  const [sysConfig, setSysConfig] = useState(null)
  const [scProEnf,  setScProEnf]  = useState(false)
  const [scLimit,   setScLimit]   = useState(10)

  // All Drafts filter
  const [draftFilter, setDraftFilter] = useState('')
  // Session refresh notice after tier change
  const [tierChangeNotice, setTierChangeNotice] = useState(null)
  // Holds a just-issued password for one display. Never re-fetchable.
  const [newPassword, setNewPassword] = useState(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [s, u, d, gp, ep, sc] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/drafts').then(r => r.json()),
        fetch('/api/admin/global-promo').then(r => r.json()),
        fetch('/api/admin/email-promos').then(r => r.json()),
        fetch('/api/admin/system-config').then(r => r.json()).catch(() => ({})),
      ])
      setStats(s.stats || null)
      setUsers(u.users || [])
      setDrafts(d.drafts || [])
      setGlobalPromo(gp.promo || null)
      setEmailPromos(ep.promos || [])
      // Prefill global promo form with existing window if any.
      if (gp.promo) {
        setGpStart(toLocalInput(gp.promo.startsAt))
        setGpEnd(toLocalInput(gp.promo.endsAt))
        setGpNote(gp.promo.note || '')
      }
      // System config (Pro toggle + free quota)
      if (sc?.config) {
        setSysConfig(sc.config)
        // Storage flag is INVERTED for admin UI:
        //   storage true  = Free tier enforced  ⇒ toggle should show OFF
        //   storage false = Everyone gets Pro   ⇒ toggle should show ON
        setScProEnf(!sc.config.proEnforcementEnabled)
        setScLimit(typeof sc.config.freeDocsLimit === 'number' ? sc.config.freeDocsLimit : 10)
      }
    } catch (e) {
      setErr('Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function saveGlobalPromo() {
    if (!gpStart || !gpEnd) { alert('Start and end dates are required.'); return }
    setBusy(b => ({ ...b, gpSave: true }))
    try {
      const r = await fetch('/api/admin/global-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startsAt: new Date(gpStart).toISOString(),
          endsAt:   new Date(gpEnd).toISOString(),
          note:     gpNote,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Save failed')
      await loadAll()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, gpSave: false }))
    }
  }

  async function cancelGlobalPromo() {
    if (!confirm('Cancel the global free-Pro window? Everyone on free tier will lose Pro access immediately (unless they have a personal grant).')) return
    setBusy(b => ({ ...b, gpDel: true }))
    try {
      const r = await fetch('/api/admin/global-promo', { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Cancel failed')
      setGpStart(''); setGpEnd(''); setGpNote('')
      await loadAll()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, gpDel: false }))
    }
  }

  async function addEmailPromo() {
    if (!epEmail || !epStart || !epEnd) { alert('Email, start and end are required.'); return }
    setBusy(b => ({ ...b, epAdd: true }))
    try {
      const r = await fetch('/api/admin/email-promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    epEmail,
          startsAt: new Date(epStart).toISOString(),
          endsAt:   new Date(epEnd).toISOString(),
          note:     epNote,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Add failed')
      setEpEmail(''); setEpStart(''); setEpEnd(''); setEpNote('')
      await loadAll()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, epAdd: false }))
    }
  }

  async function deleteEmailPromo(id, email) {
    if (!confirm(`Delete free-Pro grant for ${email}?`)) return
    setBusy(b => ({ ...b, [id + 'ep']: true }))
    try {
      const r = await fetch(`/api/admin/email-promos/${id}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Delete failed')
      await loadAll()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, [id + 'ep']: false }))
    }
  }

  async function saveSystemConfig() {
    const limit = Number(scLimit)
    if (!Number.isFinite(limit) || limit < 0 || limit > 1000) {
      alert('Free docs limit must be a number between 0 and 1000.')
      return
    }
    setBusy(b => ({ ...b, scSave: true }))
    try {
      const r = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proEnforcementEnabled: !scProEnf,   // inverted: toggle ON ⇒ Pro for everyone ⇒ enforcement off
          freeDocsLimit:         Math.floor(limit),
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Save failed')
      setSysConfig(j.config || null)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, scSave: false }))
    }
  }

  async function updateUser(id, patch, label) {
    setBusy(b => ({ ...b, [id + label]: true }))
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Update failed')
      await loadAll()
      // Inform admin that the user must re-login to see their new tier in-session
      if ('tier' in patch || 'suspended' in patch) {
        setTierChangeNotice(`Tier/status updated. Ask the user to sign out and sign back in — JWT sessions don't auto-refresh until re-login.`)
        setTimeout(() => setTierChangeNotice(null), 10_000)
      }
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, [id + label]: false }))
    }
  }

  // Admin override for account recovery. This is the fallback for anyone
  // the security question cannot help: accounts created before it
  // existed, a forgotten answer, or someone locked out by failed tries.
  // The generated password is shown once and cannot be read back.
  async function resetUserPassword(id, email) {
    if (!confirm(
      `Set a new password for ${email}?\n\n` +
      `Their current password stops working immediately. You will be shown the ` +
      `new one once — copy it and give it to them yourself.`
    )) return
    setBusy(b => ({ ...b, [id + 'pwd']: true }))
    try {
      const r = await fetch(`/api/admin/users/${id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),          // empty = generate one
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not set password')
      setNewPassword({ email: j.email, password: j.password })
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, [id + 'pwd']: false }))
    }
  }

  async function deleteUser(id, email) {
    if (!confirm(`Permanently delete user ${email}? This also deletes all their drafts, clients, and court dates.`)) return
    setBusy(b => ({ ...b, [id + 'del']: true }))
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Delete failed')
      await loadAll()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, [id + 'del']: false }))
    }
  }

  async function deleteDraft(id, title) {
    if (!confirm(`Delete draft "${title}"? This cannot be undone.`)) return
    setBusy(b => ({ ...b, [id + 'del']: true }))
    try {
      const r = await fetch(`/api/admin/drafts/${id}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Delete failed')
      await loadAll()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, [id + 'del']: false }))
    }
  }

  if (loading) return <div style={{ color: '#6A6A6A' }}>Loading admin data…</div>
  if (err) return <div style={{ color: '#F48080' }}>{err}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Pro Enforcement OFF warning ── */}
      {sysConfig && !sysConfig.proEnforcementEnabled && (
        <div style={{
          background: 'rgba(212,160,23,0.12)',
          border: '1px solid rgba(212,160,23,0.5)',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, color: '#D4A017', fontWeight: 700, marginBottom: 4 }}>
              Pro Enforcement is OFF — all users currently have free Pro access
            </div>
            <div style={{ fontSize: 12, color: '#A08020', lineHeight: 1.55 }}>
              Every signed-in user is getting the full Pro experience (unlimited drafts, 70B model, Case Assistant, all routes).
              Monthly quotas and tier checks are bypassed. Turn Pro Mode OFF in System Settings below to re-enable free-tier limits.
            </div>
          </div>
        </div>
      )}

      {/* ── Tier change notice ── */}
      {/* Shown once after an admin password reset. Dismissing it loses the
          password for good — it is stored only as a bcrypt hash. */}
      {newPassword && (
        <div style={{
          background: 'rgba(212,160,23,0.07)', border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12, padding: '16px 18px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '1.4px', color: '#D4A017', marginBottom: 8 }}>
            NEW PASSWORD — SHOWN ONCE
          </div>
          <div style={{ fontSize: 13, color: '#B0A488', marginBottom: 10, lineHeight: 1.6 }}>
            For <b style={{ color: '#E8E8E8' }}>{newPassword.email}</b>. Copy it now and
            give it to them over a channel you trust. Close this and it is gone —
            only a hash is stored. Tell them to change it after signing in.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <code style={{
              flex: '1 1 220px', background: '#0D0D0D', border: '1px solid #2A2A2A',
              borderRadius: 8, padding: '11px 14px', fontSize: 16, letterSpacing: '1px',
              color: '#F0C040', fontFamily: 'ui-monospace, Menlo, monospace', userSelect: 'all',
            }}>{newPassword.password}</code>
            <Btn onClick={() => navigator.clipboard?.writeText(newPassword.password)}>Copy</Btn>
            <Btn onClick={() => setNewPassword(null)} danger>Done</Btn>
          </div>
        </div>
      )}

      {tierChangeNotice && (
        <div style={{
          background: 'rgba(96,165,250,0.12)',
          border: '1px solid rgba(96,165,250,0.4)',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          color: '#93C5FD',
        }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          {tierChangeNotice}
        </div>
      )}

      {/* ── Stats ── */}
      {stats && (
        <section>
          <h2 style={{ fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
            Platform Stats
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={CARD}><div style={LABEL}>Total Users</div><div style={VALUE}>{stats.totalUsers}</div></div>
            <div style={CARD}><div style={LABEL}>Pro Users</div><div style={{ ...VALUE, color: '#D4A017' }}>{stats.proUsers}</div></div>
            <div style={CARD}><div style={LABEL}>Free Users</div><div style={VALUE}>{stats.freeUsers}</div></div>
            <div style={CARD}><div style={LABEL}>Suspended</div><div style={{ ...VALUE, color: stats.suspendedUsers > 0 ? '#F48080' : '#F0F0F0' }}>{stats.suspendedUsers}</div></div>
            <div style={CARD}><div style={LABEL}>Total Drafts</div><div style={VALUE}>{stats.totalDrafts}</div></div>
            <div style={CARD}><div style={LABEL}>Drafts Today</div><div style={VALUE}>{stats.draftsToday}</div></div>
            <div style={CARD}><div style={LABEL}>Last 7 Days</div><div style={VALUE}>{stats.draftsLast7Days}</div></div>
            <div style={CARD}><div style={LABEL}>This Month</div><div style={VALUE}>{stats.draftsThisMonth}</div></div>
            <div style={CARD}><div style={LABEL}>Clients</div><div style={VALUE}>{stats.totalClients}</div></div>
            <div style={CARD}><div style={LABEL}>Court Dates</div><div style={VALUE}>{stats.totalCourtDates}</div></div>
          </div>
        </section>
      )}

      {/* ── System Settings (Pro toggle + free quota) ── */}
      <section>
        <h2 style={{ fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
          System Settings
        </h2>
        <div style={{ fontSize: 12, color: '#6A6A6A', marginBottom: 12 }}>
          Master switch for the entire app. <b style={{ color: '#C0C0C0' }}>Pro ON</b> = every signed-in user gets the full Pro experience (longer drafts, full citations, AI Case Assistant, no monthly cap). <b style={{ color: '#C0C0C0' }}>Pro OFF</b> = everyone is on the free tier with the monthly draft cap below. Admin always retains Pro regardless.
        </div>

        <div style={CARD}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'flex-start' }}>
            {/* Pro enforcement toggle */}
            <div>
              <div style={FIELD_LABEL}>Pro Mode (master switch)</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  checked={scProEnf}
                  onChange={e => setScProEnf(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#D4A017', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#F0F0F0', fontWeight: 600 }}>
                  {scProEnf ? 'ON — Pro mode for everyone (unlimited)' : 'OFF — Free tier for everyone (monthly cap below)'}
                </span>
              </label>
              <div style={{ fontSize: 11, color: '#6A6A6A', marginTop: 4 }}>
                Admin always has Pro. Active promo grants override the toggle for the user / window they cover.
              </div>
            </div>

            {/* Free monthly limit */}
            <div>
              <div style={FIELD_LABEL}>Free Docs / Month</div>
              <input
                type="number"
                min={0}
                max={1000}
                step={1}
                value={scLimit}
                onChange={e => setScLimit(e.target.value)}
                style={{ ...INPUT, width: 120 }}
              />
              <div style={{ fontSize: 11, color: '#6A6A6A', marginTop: 4 }}>
                Cap on drafts a free user can generate per calendar month. Only takes effect when Pro mode is OFF.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn onClick={saveSystemConfig} disabled={busy.scSave}>
              {busy.scSave ? 'Saving…' : 'Save Settings'}
            </Btn>
            {sysConfig?.updatedAt && (
              <span style={{ fontSize: 11, color: '#6A6A6A' }}>
                Last updated {new Date(sysConfig.updatedAt).toLocaleString()}
                {sysConfig.updatedBy ? ` by ${sysConfig.updatedBy}` : ''}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Global Pro Promotion ── */}
      <section>
        <h2 style={{ fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
          Global Pro Promotion
        </h2>
        <div style={{ fontSize: 12, color: '#6A6A6A', marginBottom: 12 }}>
          Opens Pro access for <b style={{ color: '#C0C0C0' }}>every user</b> during the window below. Outside this window, regular tier rules apply.
        </div>

        <div style={CARD}>
          {globalPromo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <Badge color={statusColor(globalPromo.status)}>{globalPromo.status}</Badge>
              <span style={{ fontSize: 13, color: '#C0C0C0' }}>{fmtRange(globalPromo.startsAt, globalPromo.endsAt)}</span>
              {globalPromo.note && <span style={{ fontSize: 12, color: '#6A6A6A' }}>— {globalPromo.note}</span>}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#6A6A6A', marginBottom: 16 }}>No active or upcoming global promotion.</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <div style={FIELD_LABEL}>Start</div>
              <input type="datetime-local" value={gpStart} onChange={e => setGpStart(e.target.value)} style={{ ...INPUT, width: '100%' }} />
            </div>
            <div>
              <div style={FIELD_LABEL}>End</div>
              <input type="datetime-local" value={gpEnd} onChange={e => setGpEnd(e.target.value)} style={{ ...INPUT, width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={FIELD_LABEL}>Note (optional)</div>
              <input type="text" value={gpNote} onChange={e => setGpNote(e.target.value)} placeholder="e.g. Launch week special" style={{ ...INPUT, width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <Btn onClick={saveGlobalPromo} disabled={busy.gpSave}>
              {globalPromo ? 'Update Window' : 'Create Window'}
            </Btn>
            {globalPromo && (
              <Btn onClick={cancelGlobalPromo} disabled={busy.gpDel} danger>
                Cancel Promotion
              </Btn>
            )}
          </div>
        </div>
      </section>

      {/* ── Per-Email Pro Grants ── */}
      <section>
        <h2 style={{ fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
          Individual Pro Grants
        </h2>
        <div style={{ fontSize: 12, color: '#6A6A6A', marginBottom: 12 }}>
          Grant free Pro access to a specific email for a fixed window. Works even if that email hasn&rsquo;t registered yet — Pro kicks in automatically on signup.
        </div>

        <div style={{ ...CARD, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={FIELD_LABEL}>Email</div>
              <input type="email" value={epEmail} onChange={e => setEpEmail(e.target.value)} placeholder="friend@example.com" style={{ ...INPUT, width: '100%' }} />
            </div>
            <div>
              <div style={FIELD_LABEL}>Start</div>
              <input type="datetime-local" value={epStart} onChange={e => setEpStart(e.target.value)} style={{ ...INPUT, width: '100%' }} />
            </div>
            <div>
              <div style={FIELD_LABEL}>End</div>
              <input type="datetime-local" value={epEnd} onChange={e => setEpEnd(e.target.value)} style={{ ...INPUT, width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={FIELD_LABEL}>Note (optional)</div>
              <input type="text" value={epNote} onChange={e => setEpNote(e.target.value)} placeholder="e.g. Family member, beta tester" style={{ ...INPUT, width: '100%' }} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn onClick={addEmailPromo} disabled={busy.epAdd}>+ Add Grant</Btn>
          </div>
        </div>

        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={TH}>Email</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Window</th>
                  <th style={TH}>Note</th>
                  <th style={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailPromos.map(p => (
                  <tr key={p.id}>
                    <td style={TD}>{p.email}</td>
                    <td style={TD}><Badge color={statusColor(p.status)}>{p.status}</Badge></td>
                    <td style={TD}>{fmtRange(p.startsAt, p.endsAt)}</td>
                    <td style={{ ...TD, color: '#8A8A8A' }}>{p.note || '—'}</td>
                    <td style={TD}>
                      <Btn onClick={() => deleteEmailPromo(p.id, p.email)} disabled={busy[p.id + 'ep']} danger>Delete</Btn>
                    </td>
                  </tr>
                ))}
                {emailPromos.length === 0 && (
                  <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#6A6A6A' }}>No individual grants yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Cost of running it ── */}
      <AdminCosts />

      {/* ── Institutions ── */}
      <AdminInstitutions />

      {/* ── Users ── */}
      <section>
        <h2 style={{ fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
          Users ({users.length})
        </h2>
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={TH}>Email</th>
                  <th style={TH}>Name</th>
                  <th style={TH}>Tier</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Drafts</th>
                  <th style={TH}>Joined</th>
                  <th style={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isAdminRow = u.email.toLowerCase() === 'pratapsinghshivendra21@gmail.com'
                  return (
                    <tr key={u.id}>
                      <td style={TD}>
                        {u.email}
                        {isAdminRow && <span style={{ marginLeft: 8 }}><Badge color="#D4A017">ADMIN</Badge></span>}
                      </td>
                      <td style={TD}>{u.name || '—'}</td>
                      <td style={TD}>
                        {u.tier === 'pro' ? <Badge color="#D4A017">PRO</Badge> : <Badge color="#6A6A6A">FREE</Badge>}
                      </td>
                      <td style={TD}>
                        {u.suspended ? <Badge color="#F48080">SUSPENDED</Badge> : <Badge color="#4ADE80">ACTIVE</Badge>}
                      </td>
                      <td style={TD}>{u._count?.drafts ?? 0}</td>
                      <td style={TD}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {u.tier === 'free' ? (
                            <Btn onClick={() => updateUser(u.id, { tier: 'pro' }, 'tier')} disabled={busy[u.id + 'tier']}>
                              Upgrade
                            </Btn>
                          ) : (
                            <Btn onClick={() => updateUser(u.id, { tier: 'free' }, 'tier')} disabled={busy[u.id + 'tier'] || isAdminRow}>
                              Downgrade
                            </Btn>
                          )}
                          <Btn
                            onClick={() => updateUser(u.id, { suspended: !u.suspended }, 'sus')}
                            disabled={busy[u.id + 'sus'] || isAdminRow}
                            danger={!u.suspended}
                          >
                            {u.suspended ? 'Unsuspend' : 'Suspend'}
                          </Btn>
                          <Btn
                            onClick={() => resetUserPassword(u.id, u.email)}
                            disabled={busy[u.id + 'pwd']}
                          >
                            {busy[u.id + 'pwd'] ? 'Setting…' : 'Set password'}
                          </Btn>
                          <Btn
                            onClick={() => deleteUser(u.id, u.email)}
                            disabled={busy[u.id + 'del'] || isAdminRow}
                            danger
                          >
                            Delete
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ ...TD, textAlign: 'center', color: '#6A6A6A' }}>No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── All Drafts ── */}
      <section>
        <h2 style={{ fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
          All Drafts ({drafts.length})
        </h2>

        {/* Search box: filters by user email, title, OR document type */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={draftFilter}
            onChange={e => setDraftFilter(e.target.value)}
            placeholder="Search by user email, title, or document type..."
            style={{ ...INPUT, width: '100%' }}
          />
          {draftFilter && (
            <div style={{ fontSize: 11, color: '#6A6A6A', marginTop: 6 }}>
              Filtering on “{draftFilter}” —
              click the <span style={{ color: '#D4A017' }}>×</span> below the table to clear.
            </div>
          )}
        </div>

        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
              <thead>
                <tr>
                  <th style={TH}>Title</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>User</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Created</th>
                  <th style={TH}>Download</th>
                  <th style={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const q = draftFilter.trim().toLowerCase()
                  const filtered = q
                    ? drafts.filter(d =>
                        (d.title || '').toLowerCase().includes(q) ||
                        (d.documentType || '').toLowerCase().includes(q) ||
                        (d.user?.email || '').toLowerCase().includes(q) ||
                        (d.user?.name || '').toLowerCase().includes(q)
                      )
                    : drafts
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} style={{ ...TD, textAlign: 'center', color: '#6A6A6A' }}>
                          {q ? 'No drafts match your filter.' : 'No drafts yet.'}
                        </td>
                      </tr>
                    )
                  }
                  return filtered.map(d => (
                    <tr key={d.id}>
                      <td style={{ ...TD, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</td>
                      <td style={TD}>{d.documentType}</td>
                      <td style={TD}>{d.user?.email || '—'}</td>
                      <td style={TD}>{d.status}</td>
                      <td style={TD}>{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['pdf', 'docx', 'txt'].map(fmt => (
                            <a key={fmt}
                              href={`/api/export/${d.id}/${fmt}`}
                              title={`Download as ${fmt.toUpperCase()}`}
                              style={{
                                padding: '4px 9px',
                                background: 'rgba(212,160,23,0.10)',
                                border: '1px solid rgba(212,160,23,0.35)',
                                borderRadius: 6,
                                color: '#D4A017',
                                fontSize: 11,
                                fontWeight: 700,
                                textDecoration: 'none',
                                letterSpacing: '0.4px',
                              }}>
                              {fmt.toUpperCase()}
                            </a>
                          ))}
                        </div>
                      </td>
                      <td style={TD}>
                        <Btn onClick={() => deleteDraft(d.id, d.title)} disabled={busy[d.id + 'del']} danger>Delete</Btn>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {draftFilter && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setDraftFilter('')}
              style={{
                background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6,
                color: '#D4A017', padding: '6px 12px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}>× Clear filter</button>
          </div>
        )}
      </section>
    </div>
  )
}
