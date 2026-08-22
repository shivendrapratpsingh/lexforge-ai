'use client'

import { useCallback, useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────
//  Institutions panel — colleges and firms, in the Admin Console.
//
//  The point of this screen is that onboarding a 300-student college is
//  two fields and a save, not 300 rows. Add the email domain and every
//  student who signs up from it is linked and granted Pro automatically;
//  paste a class list for the ones whose college issues no email.
//
//  Opening one shows what a Principal will ask for: how many signed up,
//  how many actually use it, what they use, and what it costs us.
// ─────────────────────────────────────────────────────────────────

const S = {
  card: { background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18, marginBottom: 14 },
  input: {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 9,
    padding: '10px 13px', color: '#F0F0F0', fontSize: 13.5, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#8A8A8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' },
  btn: (busy, danger) => ({
    padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
    border: danger ? '1px solid rgba(225,88,75,.45)' : 'none',
    background: danger ? 'rgba(225,88,75,.10)' : 'linear-gradient(135deg,#D4A017,#B8860B)',
    color: danger ? '#E1584B' : '#0D0D0D',
  }),
  ghost: { padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid #2E2718', background: 'transparent', color: '#9A8C6E' },
  kicker: { fontSize: 10, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#D4A017', marginBottom: 8 },
  err: { background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)', color: '#FF8A80', padding: '10px 13px', borderRadius: 9, fontSize: 12.5, lineHeight: 1.6, marginTop: 10 },
  ok: { background: 'rgba(63,166,107,.08)', border: '1px solid rgba(63,166,107,.28)', color: '#5FCC8D', padding: '10px 13px', borderRadius: 9, fontSize: 12.5, lineHeight: 1.6, marginTop: 10 },
  stat: { background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10, padding: '11px 13px' },
}

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Colleges that filled in the form on /for-colleges and are waiting for
// a reply. Shown above the institutions list because a request nobody
// answers is a lost customer, and it is the only thing on this screen
// with a person on the other end of it.
function PilotRequests() {
  const [d, setD] = useState(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/pilot-requests')
      if (r.ok) setD(await r.json())
    } catch { /* the panel simply does not render */ }
  }, [])
  useEffect(() => { load() }, [load])

  async function move(id, status) {
    setBusy(id)
    try {
      await fetch('/api/admin/pilot-requests', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      load()
    } finally { setBusy('') }
  }

  if (!d?.requests?.length) return null

  const tone = { new: '#D4A017', contacted: '#60A5FA', converted: '#5FCC8D', declined: '#6A6A6A' }

  return (
    <div style={{ ...S.card, borderColor: d.waiting > 0 ? 'rgba(212,160,23,.35)' : '#2A2A2A' }}>
      <div style={S.kicker}>Pilot requests</div>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0', margin: 0 }}>
        {d.waiting > 0 ? `${d.waiting} college${d.waiting === 1 ? '' : 's'} waiting for a reply` : 'All replied to'}
      </h2>
      <div style={{ marginTop: 14 }}>
        {d.requests.map(r => (
          <div key={r.id} style={{ borderTop: '1px solid #1F1F1F', padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F0E4C0' }}>{r.college}</span>
              <span style={{
                fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', padding: '3px 7px',
                borderRadius: 5, textTransform: 'uppercase',
                border: `1px solid ${tone[r.status]}55`, color: tone[r.status],
              }}>{r.status}</span>
              <span style={{ fontSize: 11.5, color: '#6E6E68' }}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9A9A9A', marginTop: 4, lineHeight: 1.6 }}>
              {r.contactName} · <a href={`mailto:${r.contactEmail}`} style={{ color: '#9A8C6E' }}>{r.contactEmail}</a>
              {r.phone && ` · ${r.phone}`}
              {r.role && ` · ${r.role}`}
              {r.students && ` · ${r.students} students`}
            </div>
            {r.message && (
              <div style={{ fontSize: 12.5, color: '#8A8A8A', marginTop: 6, lineHeight: 1.7, fontStyle: 'italic' }}>
                “{r.message}”
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
              {['contacted', 'converted', 'declined'].filter(sx => sx !== r.status).map(sx => (
                <button key={sx} type="button" onClick={() => move(r.id, sx)} disabled={busy === r.id}
                  style={{ ...S.ghost, padding: '5px 11px', fontSize: 11.5 }}>
                  Mark {sx}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminInstitutions() {
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(null)      // institution id being viewed
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/institutions')
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setList(j.institutions)
    } catch (e) { setErr(e.message) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <>
    <PilotRequests />
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={S.kicker}>Institutions</div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0', margin: 0 }}>Colleges &amp; firms</h2>
          <p style={{ fontSize: 12.5, color: '#6E6E68', margin: '5px 0 0', lineHeight: 1.6, maxWidth: '62ch' }}>
            Add a college with its email domain and every student who signs up
            from that domain gets Pro automatically — no adding them one at a
            time. For colleges that issue no student email, paste a class list.
          </p>
        </div>
        <button type="button" style={S.btn(false)} onClick={() => setAdding(v => !v)}>
          {adding ? 'Close' : '+ Add institution'}
        </button>
      </div>

      {err && <div style={S.err}>{err}</div>}
      {adding && <AddForm onDone={() => { setAdding(false); load() }} />}

      <div style={{ marginTop: 16 }}>
        {list === null && <div style={{ fontSize: 13, color: '#6A6A6A' }}>Loading…</div>}
        {list?.length === 0 && (
          <div style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.65 }}>
            No institutions yet. Add the first college and its students are
            onboarded the moment they sign up.
          </div>
        )}
        {list?.map(i => (
          <div key={i.id} style={{ borderTop: '1px solid #1F1F1F', padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setOpen(open === i.id ? null : i.id)}
                style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 14.5, fontWeight: 700, color: '#F0E4C0' }}>
                {i.name}
              </button>
              <span style={{
                fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', padding: '3px 7px', borderRadius: 5,
                textTransform: 'uppercase',
                border: `1px solid ${i.active ? 'rgba(63,166,107,.4)' : 'rgba(225,88,75,.4)'}`,
                color: i.active ? '#5FCC8D' : '#E1584B',
              }}>{i.active ? i.plan : 'inactive'}</span>
              <span style={{ fontSize: 11.5, color: '#6E6E68' }}>
                {i.members} member{i.members === 1 ? '' : 's'}
                {i.invites > 0 && ` · ${i.invites} invited`}
                {' · '}{money(i.spend30dRupees)} in 30 days
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 3, fontFamily: 'ui-monospace, Menlo, monospace' }}>
              {i.emailDomains || '(no domains — code or invite only)'}
              {i.joinCode && <span style={{ color: '#9A8C6E' }}>{'  ·  join code '}<strong style={{ color: '#D4A017' }}>{i.joinCode}</strong></span>}
            </div>
            {open === i.id && <Detail id={i.id} onChanged={load} />}
          </div>
        ))}
      </div>
    </div>
    </>
  )
}

function AddForm({ onDone }) {
  const [f, setF] = useState({ name: '', emailDomains: '', kind: 'college', plan: 'pilot', endsAt: '', contactName: '', contactEmail: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/admin/institutions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true, text: `Created. ${j.linkedExistingUsers} existing user${j.linkedExistingUsers === 1 ? '' : 's'} on that domain linked immediately.` })
      setTimeout(onDone, 1200)
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} style={{ marginTop: 14, padding: 14, background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10 }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <div>
          <label style={S.label}>Name</label>
          <input value={f.name} onChange={set('name')} required style={S.input} placeholder="University Law College, Bangalore" />
        </div>
        <div>
          <label style={S.label}>Email domains</label>
          <input value={f.emailDomains} onChange={set('emailDomains')} style={S.input} placeholder="ulc.ac.in, bub.ernet.in" />
        </div>
        <div>
          <label style={S.label}>Kind</label>
          <select value={f.kind} onChange={set('kind')} style={S.input}>
            <option value="college">College</option>
            <option value="firm">Law firm</option>
            <option value="chamber">Chamber</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Plan</label>
          <select value={f.plan} onChange={set('plan')} style={S.input}>
            <option value="pilot">Pilot (free)</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Access ends (optional)</label>
          <input type="date" value={f.endsAt} onChange={set('endsAt')} style={S.input} />
        </div>
        <div>
          <label style={S.label}>Contact email</label>
          <input value={f.contactEmail} onChange={set('contactEmail')} style={S.input} placeholder="moot.convenor@…" />
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '10px 0 12px', lineHeight: 1.6 }}>
        Public providers — gmail, yahoo, outlook — are refused as domains: one
        such row would hand Pro to every user who ever signs up. Invite those
        students by email instead. Leave the end date blank for no expiry.
      </p>
      <button type="submit" style={S.btn(busy)} disabled={busy}>{busy ? 'Creating…' : 'Create institution'}</button>
      {msg && <div style={msg.ok ? S.ok : S.err}>{msg.text}</div>}
    </form>
  )
}

function Detail({ id, onChanged }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('activity')

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/institutions/${id}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setD(j)
    } catch (e) { setErr(e.message) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (err) return <div style={S.err}>{err}</div>
  if (!d) return <div style={{ fontSize: 12.5, color: '#6A6A6A', marginTop: 10 }}>Loading…</div>

  const chip = (k, label) => (
    <button type="button" onClick={() => setTab(k)} style={{
      padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
      border: `1px solid ${tab === k ? 'rgba(212,160,23,.5)' : '#2A2A2A'}`,
      background: tab === k ? 'rgba(212,160,23,.12)' : 'transparent',
      color: tab === k ? '#D4A017' : '#8A8A8A',
    }}>{label}</button>
  )

  return (
    <div style={{ marginTop: 12, padding: 14, background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10 }}>
      <div style={{ display: 'grid', gap: 9, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', marginBottom: 14 }}>
        <div style={S.stat}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', lineHeight: 1 }}>{d.activity.signedUp}</div>
          <div style={{ fontSize: 10.5, color: '#6E6E68', marginTop: 4 }}>Signed up</div>
        </div>
        <div style={S.stat}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#5FCC8D', lineHeight: 1 }}>{d.activity.activeLast30Days}</div>
          <div style={{ fontSize: 10.5, color: '#6E6E68', marginTop: 4 }}>Active 30d</div>
        </div>
        <div style={S.stat}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#D4A017', lineHeight: 1 }}>{d.activity.draftsCreated}</div>
          <div style={{ fontSize: 10.5, color: '#6E6E68', marginTop: 4 }}>Documents</div>
        </div>
        <div style={S.stat}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', lineHeight: 1 }}>{money(d.cost.totalRupees)}</div>
          <div style={{ fontSize: 10.5, color: '#6E6E68', marginTop: 4 }}>Cost 30d</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {chip('activity', 'What they use')}
        {chip('members', `Members (${d.memberList.length})`)}
        {chip('invite', 'Invite a class')}
        {chip('invoices', 'Invoices')}
        {chip('settings', 'Settings')}
      </div>

      {tab === 'activity' && (
        d.activity.byFeature.length === 0
          ? <div style={{ fontSize: 12.5, color: '#8A8A8A' }}>Nobody has used a billed feature yet.</div>
          : d.activity.byFeature.map(f => (
              <div key={f.feature} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1A1A1A', fontSize: 12.5 }}>
                <span style={{ color: '#C0C0C0' }}>{f.feature}</span>
                <span style={{ color: '#6E6E68' }}>{f.calls} call{f.calls === 1 ? '' : 's'} · {money(f.rupees)}</span>
              </div>
            ))
      )}

      {tab === 'members' && <Members id={id} members={d.memberList} onChanged={load} />}

      {tab === 'invite' && <InviteForm id={id} onDone={() => { load(); onChanged?.() }} />}
      {tab === 'invoices' && <Invoices id={id} suggestedSeats={d.activity.signedUp} />}
      {tab === 'settings' && <Settings inst={d.institution} onDone={() => { load(); onChanged?.() }} />}
    </div>
  )
}

// Marking somebody faculty hands them the roster of everyone at their
// college, so it happens here, after confirming with the college who the
// co-ordinator actually is — never on a user's own say-so.
function Members({ id, members, onChanged }) {
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null)

  async function setRole(userId, role) {
    setBusy(userId); setMsg(null)
    try {
      const r = await fetch(`/api/admin/institutions/${id}/members`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      onChanged?.()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy('') }
  }

  if (!members.length) return <div style={{ fontSize: 12.5, color: '#8A8A8A' }}>Nobody has signed up yet.</div>

  return (
    <>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1A1A1A', fontSize: 12.5, flexWrap: 'wrap' }}>
            <span style={{ color: '#C0C0C0', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.email}
              {m.batch && <span style={{ color: '#6E6E68' }}> · {m.batch}</span>}
              {m.role === 'faculty' && <span style={{ color: '#D4A017' }}> · faculty</span>}
            </span>
            <span style={{ color: '#6E6E68', flex: 'none' }}>{m.drafts} doc{m.drafts === 1 ? '' : 's'}</span>
            <button type="button" disabled={busy === m.id}
              onClick={() => setRole(m.id, m.role === 'faculty' ? 'student' : 'faculty')}
              style={{ ...S.ghost, padding: '4px 10px', fontSize: 11 }}>
              {m.role === 'faculty' ? 'Make student' : 'Make faculty'}
            </button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 10, lineHeight: 1.6 }}>
        A faculty co-ordinator gets their college&rsquo;s roster, its join code
        and its activity at /college — how much each student works, never what
        they wrote.
      </p>
      {msg && <div style={S.err}>{msg.text}</div>}
    </>
  )
}

// A college cannot pay against an email — it needs a numbered document
// to raise a purchase order against. Seats default to the number who
// actually signed up, because billing for 300 when 40 use it is how a
// pilot becomes an argument.
// ₹420 per student per month, or ₹3,528 per student per year — 30% off
// twelve months. Offered as buttons rather than typed each time, because
// a price typed by hand is a price that will eventually be typed wrong
// on a document a college keeps.
const SEAT_MONTHLY = 420
const SEAT_YEARLY = 3528

function Invoices({ id, suggestedSeats }) {
  const [d, setD] = useState(null)
  const [f, setF] = useState({
    description: 'LexForge Pro — annual institutional licence',
    seats: String(suggestedSeats || 1), unitRupees: String(SEAT_YEARLY),
    periodStart: '', periodEnd: '', notes: '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/institutions/${id}/invoices`)
      if (r.ok) setD(await r.json())
    } catch { /* the list simply does not render */ }
  }, [id])
  useEffect(() => { load() }, [load])

  const total = (Number(f.seats) || 0) * (Number(f.unitRupees) || 0)
  const tax = d ? total * (d.taxPercent / 100) : 0

  async function raise(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/admin/institutions/${id}/invoices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true, text: `${j.invoice.number} raised.` })
      load()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  async function mark(invoiceId, status) {
    setBusy(true)
    try {
      await fetch(`/api/admin/institutions/${id}/invoices`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, status }),
      })
      load()
    } finally { setBusy(false) }
  }

  return (
    <div>
      {d?.invoices?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {d.invoices.map(iv => (
            <div key={iv.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1A1A1A', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <a href={`/admin/invoice/${iv.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, fontWeight: 700, color: '#D4A017', textDecoration: 'none' }}>{iv.number}</a>
                <span style={{ fontSize: 11.5, color: '#6E6E68', marginLeft: 8 }}>
                  {iv.status} · {iv.seats} seats · {money(iv.totalPaise / 100)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {iv.status !== 'paid' && <button type="button" style={{ ...S.ghost, padding: '4px 10px', fontSize: 11.5 }} onClick={() => mark(iv.id, 'paid')} disabled={busy}>Mark paid</button>}
                {iv.status !== 'cancelled' && <button type="button" style={{ ...S.ghost, padding: '4px 10px', fontSize: 11.5 }} onClick={() => mark(iv.id, 'cancelled')} disabled={busy}>Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={raise}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>What for</label>
            <input value={f.description} onChange={set('description')} required style={S.input} />
          </div>
          <div>
            <label style={S.label}>Seats</label>
            <input type="number" min="1" value={f.seats} onChange={set('seats')} required style={S.input} />
          </div>
          <div>
            <label style={S.label}>Price per seat (₹)</label>
            <input type="number" min="0" step="1" value={f.unitRupees} onChange={set('unitRupees')} required style={S.input} placeholder={String(SEAT_YEARLY)} />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button type="button" style={{ ...S.ghost, padding: '4px 9px', fontSize: 11 }}
                onClick={() => setF(v => ({ ...v, unitRupees: String(SEAT_YEARLY), description: 'LexForge Pro — annual institutional licence' }))}>
                ₹{SEAT_YEARLY} / year
              </button>
              <button type="button" style={{ ...S.ghost, padding: '4px 9px', fontSize: 11 }}
                onClick={() => setF(v => ({ ...v, unitRupees: String(SEAT_MONTHLY), description: 'LexForge Pro — monthly institutional licence' }))}>
                ₹{SEAT_MONTHLY} / month
              </button>
            </div>
          </div>
          <div>
            <label style={S.label}>Period from</label>
            <input type="date" value={f.periodStart} onChange={set('periodStart')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Period to</label>
            <input type="date" value={f.periodEnd} onChange={set('periodEnd')} style={S.input} />
          </div>
        </div>

        <div style={{ margin: '12px 0', fontSize: 13, color: '#C0C0C0' }}>
          {money(total)}
          {d?.taxPercent > 0
            ? <> + {d.taxPercent}% GST {money(tax)} = <strong style={{ color: '#F0E4C0' }}>{money(total + tax)}</strong></>
            : <span style={{ color: '#6E6E68' }}> — proforma, no GST charged (no registration yet)</span>}
        </div>

        <button type="submit" style={S.btn(busy)} disabled={busy}>{busy ? 'Raising…' : 'Raise invoice'}</button>
        {msg && <div style={msg.ok ? S.ok : S.err}>{msg.text}</div>}
        <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '10px 0 0', lineHeight: 1.6 }}>
          Seats default to how many students actually signed up. Billing for
          three hundred when forty use it is how a renewal turns into an
          argument. Numbers run in one unbroken series per financial year, and
          a cancelled invoice keeps its number.
        </p>
      </form>
    </div>
  )
}

function InviteForm({ id, onDone }) {
  const [emails, setEmails] = useState('')
  const [batch, setBatch] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function send(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/admin/institutions/${id}/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, batch }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true, text: `Found ${j.found}. Invited ${j.invited}${j.alreadyInvited ? `, ${j.alreadyInvited} already on the list` : ''}${j.linkedExistingUsers ? `, ${j.linkedExistingUsers} existing user(s) linked now` : ''}.` })
      setEmails('')
      onDone?.()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={send}>
      <label style={S.label}>Paste the class list</label>
      <textarea value={emails} onChange={e => setEmails(e.target.value)} rows={5} required
        style={{ ...S.input, resize: 'vertical', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}
        placeholder={'ravi@gmail.com, sunita@yahoo.in\nor one per line, or a pasted spreadsheet column —\nit picks the addresses out of whatever you paste'} />
      <div style={{ marginTop: 10, marginBottom: 12, maxWidth: 260 }}>
        <label style={S.label}>Batch (optional)</label>
        <input value={batch} onChange={e => setBatch(e.target.value)} style={S.input} placeholder="BA LLB 2027" />
      </div>
      <button type="submit" style={S.btn(busy)} disabled={busy}>{busy ? 'Inviting…' : 'Invite these students'}</button>
      <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '10px 0 0', lineHeight: 1.6 }}>
        Anyone already signed up is linked immediately; the rest are linked the
        moment they register. Re-pasting a list that overlaps an earlier one is
        fine — duplicates are skipped, not rejected.
      </p>
      {msg && <div style={msg.ok ? S.ok : S.err}>{msg.text}</div>}
    </form>
  )
}

function Settings({ inst, onDone }) {
  const [f, setF] = useState({
    name: inst.name, emailDomains: inst.emailDomains, plan: inst.plan, kind: inst.kind,
    endsAt: inst.endsAt ? String(inst.endsAt).slice(0, 10) : '',
    contactEmail: inst.contactEmail || '', notes: inst.notes || '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/admin/institutions/${inst.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true, text: `Saved.${j.linkedExistingUsers ? ` ${j.linkedExistingUsers} more user(s) linked.` : ''}` })
      onDone?.()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  async function regenerate() {
    if (!confirm('Issue a new code? Anyone who has the old one and has not joined yet will not be able to.')) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/admin/institutions/${inst.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateJoinCode: true }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true, text: `New code: ${j.institution.joinCode}` })
      onDone?.()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  async function remove() {
    if (!confirm(`Remove ${inst.name}? Its members keep their accounts and all their work — they simply lose institutional Pro.`)) return
    setBusy(true)
    try {
      const r = await fetch(`/api/admin/institutions/${inst.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error((await r.json()).error)
      onDone?.()
    } catch (e) { setMsg({ ok: false, text: e.message }); setBusy(false) }
  }

  return (
    <form onSubmit={save}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
        <div><label style={S.label}>Name</label><input value={f.name} onChange={set('name')} style={S.input} /></div>
        <div><label style={S.label}>Email domains</label><input value={f.emailDomains} onChange={set('emailDomains')} style={S.input} /></div>
        <div>
          <label style={S.label}>Plan</label>
          <select value={f.plan} onChange={set('plan')} style={S.input}>
            <option value="pilot">Pilot (free)</option><option value="paid">Paid</option><option value="expired">Expired</option>
          </select>
        </div>
        <div><label style={S.label}>Access ends</label><input type="date" value={f.endsAt} onChange={set('endsAt')} style={S.input} /></div>
        <div><label style={S.label}>Contact email</label><input value={f.contactEmail} onChange={set('contactEmail')} style={S.input} /></div>
      </div>
      <div style={{ marginTop: 14, padding: 14, background: '#0A0A0A', border: '1px solid #232323', borderRadius: 10 }}>
        <div style={S.label}>Join code</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <code style={{ fontSize: 20, fontWeight: 800, color: '#D4A017', letterSpacing: '3px' }}>
            {inst.joinCode || '—'}
          </code>
          <button type="button" style={S.ghost} onClick={regenerate} disabled={busy}>Regenerate</button>
        </div>
        <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '9px 0 0', lineHeight: 1.65 }}>
          Read this out and students join themselves — no class list, no
          college email needed. Regenerating cuts off anyone holding the old
          one, which is what you want the day it turns up in a public group.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="submit" style={S.btn(busy)} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" style={S.btn(busy, true)} onClick={remove} disabled={busy}>Remove institution</button>
      </div>
      {msg && <div style={msg.ok ? S.ok : S.err}>{msg.text}</div>}
    </form>
  )
}
