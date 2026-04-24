'use client'

import { useEffect, useState } from 'react'

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

  async function loadAll() {
    setLoading(true)
    try {
      const [s, u, d, gp, ep] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/drafts').then(r => r.json()),
        fetch('/api/admin/global-promo').then(r => r.json()),
        fetch('/api/admin/email-promos').then(r => r.json()),
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
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => ({ ...b, [id + label]: false }))
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
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={TH}>Title</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>User</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Created</th>
                  <th style={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map(d => (
                  <tr key={d.id}>
                    <td style={{ ...TD, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</td>
                    <td style={TD}>{d.documentType}</td>
                    <td style={TD}>{d.user?.email || '—'}</td>
                    <td style={TD}>{d.status}</td>
                    <td style={TD}>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={TD}>
                      <Btn onClick={() => deleteDraft(d.id, d.title)} disabled={busy[d.id + 'del']} danger>Delete</Btn>
                    </td>
                  </tr>
                ))}
                {drafts.length === 0 && (
                  <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#6A6A6A' }}>No drafts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
