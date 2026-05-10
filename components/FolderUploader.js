'use client'
// ─────────────────────────────────────────────────────────────────
//  FolderUploader — reads every supported file inside a chosen folder
//  on the client, concatenates the text, and hands it back to the
//  caller via onText(combinedText, fileSummaries[]).
//
//  Supports:  .txt .md .csv .json .html .htm  (native)
//             .docx                            (mammoth from CDN)
//             .pdf                             (pdfjs-dist from CDN)
//  Skips with a warning: .doc (legacy), images, archives.
//
//  CDN-loaded parsers keep the main JS bundle small — they're only
//  fetched when the user actually drops a PDF / DOCX file.
// ─────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react'

const MAX_FILES = 60                      // safety cap per folder
const MAX_TOTAL_CHARS = 240_000           // ~60K tokens — well under model limit
const TEXT_EXTS = ['txt','md','markdown','csv','json','html','htm','rtf']

function ext(name) { return (name.split('.').pop() || '').toLowerCase() }

// Lazy-load pdfjs only when needed.
let _pdfjs = null
async function loadPdfjs() {
  if (_pdfjs) return _pdfjs
  const mod = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs')
  mod.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs'
  _pdfjs = mod
  return mod
}

let _mammoth = null
async function loadMammoth() {
  if (_mammoth) return _mammoth
  // mammoth UMD attaches to window.mammoth
  if (window.mammoth) return (_mammoth = window.mammoth)
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load mammoth.js from CDN'))
    document.head.appendChild(s)
  })
  return (_mammoth = window.mammoth)
}

async function readPdf(file) {
  const pdfjs = await loadPdfjs()
  const buf = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buf }).promise
  let out = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    out += tc.items.map(it => it.str).join(' ') + '\n\n'
  }
  return out.trim()
}

async function readDocx(file) {
  const mammoth = await loadMammoth()
  const buf = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
  return (value || '').trim()
}

async function readPlain(file) {
  return (await file.text()).trim()
}

async function extractOne(file) {
  const e = ext(file.name)
  if (TEXT_EXTS.includes(e))            return readPlain(file)
  if (e === 'pdf')                      return readPdf(file)
  if (e === 'docx')                     return readDocx(file)
  if (e === 'doc')                      throw new Error('Legacy .doc not supported — convert to .docx first.')
  throw new Error(`Skipped (unsupported type .${e})`)
}

export default function FolderUploader({ onText, hint }) {
  const inputRef = useRef(null)
  const [files, setFiles]   = useState([])   // [{name, status, size, preview, error?}]
  const [busy, setBusy]     = useState(false)
  const [combined, setCombined] = useState('')

  async function handleFiles(fileList) {
    const all = Array.from(fileList || [])
    if (!all.length) return
    setBusy(true)
    setFiles([])
    setCombined('')

    // Filter out hidden / system files and cap count
    const usable = all
      .filter(f => !f.name.startsWith('.') && f.size > 0 && f.size < 25 * 1024 * 1024)
      .slice(0, MAX_FILES)

    const results = []
    let bigText = ''

    for (const file of usable) {
      const rec = {
        name: file.webkitRelativePath || file.name,
        size: file.size,
        status: 'reading',
        preview: '',
      }
      results.push(rec)
      setFiles([...results])

      try {
        let text = await extractOne(file)
        if (!text) throw new Error('Empty file')

        // Trim per-file to keep total reasonable
        if (text.length > 30_000) text = text.slice(0, 30_000) + '\n[…truncated…]'
        rec.status = 'ok'
        rec.preview = text.slice(0, 120).replace(/\s+/g, ' ').trim() + '…'

        const header = `\n\n══════ FILE: ${rec.name} ══════\n`
        if ((bigText + header + text).length > MAX_TOTAL_CHARS) {
          rec.status = 'partial'
          const remaining = MAX_TOTAL_CHARS - bigText.length - header.length
          if (remaining > 200) bigText += header + text.slice(0, remaining)
          break
        }
        bigText += header + text
      } catch (e) {
        rec.status = 'error'
        rec.error  = e?.message || 'Failed to read'
      }
      setFiles([...results])
    }

    setCombined(bigText)
    setBusy(false)
    onText && onText(bigText.trim(), results)
  }

  function clear() {
    setFiles([])
    setCombined('')
    if (inputRef.current) inputRef.current.value = ''
    onText && onText('', [])
  }

  const stats = {
    total:  files.length,
    ok:     files.filter(f => f.status === 'ok').length,
    err:    files.filter(f => f.status === 'error').length,
    chars:  combined.length,
  }

  return (
    <div>
      <div style={{
        background: '#0D0D0D',
        border: '1.5px dashed #2A2A2A',
        borderRadius: 12,
        padding: '24px 18px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>📁</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#D0D0D0', marginBottom: 4 }}>
          Upload an entire case folder
        </div>
        <div style={{ fontSize: 11, color: '#5A5A5A', marginBottom: 14, lineHeight: 1.5, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
          {hint || 'AI reads every file (.pdf, .docx, .txt, .md, .csv, .html, .json), concatenates the content and uses it to draft your document. Up to ' + MAX_FILES + ' files, 25 MB each.'}
        </div>

        <input
          ref={inputRef}
          type="file"
          // @ts-ignore — non-standard but supported in all major browsers
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            style={{
              padding: '10px 18px',
              background: busy ? '#1C1C1C' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: busy ? '#5A5A5A' : '#fff',
              border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? '⏳ Reading folder…' : '📂 Choose Folder'}
          </button>
          {files.length > 0 && !busy && (
            <button type="button" onClick={clear}
              style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, color: '#9A9A9A', fontSize: 12, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#6A6A6A', marginBottom: 8 }}>
            <span>
              {stats.ok} of {stats.total} read
              {stats.err > 0 && <span style={{ color: '#FF6B6B' }}> · {stats.err} failed</span>}
            </span>
            <span style={{ fontFamily: 'monospace', color: '#5A5A5A' }}>
              {(stats.chars / 1000).toFixed(1)}K chars extracted
            </span>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, maxHeight: 220, overflowY: 'auto' }}>
            {files.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                borderBottom: i < files.length - 1 ? '1px solid #1A1A1A' : 'none',
                fontSize: 11.5,
              }}>
                <span style={{ width: 16, textAlign: 'center' }}>
                  {f.status === 'reading' ? '⏳' :
                   f.status === 'ok'      ? '✅' :
                   f.status === 'partial' ? '✂️' :
                                            '❌'}
                </span>
                <span style={{ flex: 1, color: f.status === 'ok' ? '#C0C0C0' : '#7A7A7A', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <span style={{ color: '#4A4A4A', fontFamily: 'monospace', fontSize: 10 }}>
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                {f.error && (
                  <span style={{ color: '#FF6B6B', fontSize: 10 }}>{f.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
