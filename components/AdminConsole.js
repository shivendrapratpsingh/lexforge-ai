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

export default function AdminConsole() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState({})
  const [err, setErr] = useState(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [s, u, d] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/drafts').then(r => r.json()),
      ])
      setStats(s.stats || null)
      setUsers(u.users || [])
      setDrafts(d.drafts || [])
    } catch (e) {
      setErr('Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

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
