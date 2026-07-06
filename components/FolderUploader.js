'use client'
// ─────────────────────────────────────────────────────────────────
//  FolderUploader — reads every supported file inside a chosen folder
//  (OR a single chosen file — Word doc, scanned PDF, etc.) on the
//  client, concatenates the text, and hands it back to the caller via
//  onText(combinedText, fileSummaries[]).
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

const MAX_FILES        = 60                      // safety cap per folder
const MAX_FILE_BYTES   = 500 * 1024 * 1024       // 500 MB per file — legal scans can be huge

// Text-budget caps.  When queued-brief mode is enabled we ship the WHOLE
// document text to the server (up to 2 MB ≈ 600-800 pages) so the
// background pipeline can process every page.  In the streaming-only
// mode we keep the old 240 KB cap so we don't waste time extracting
// pages the model would never see.
const QUEUE_MODE      = process.env.NEXT_PUBLIC_ENABLE_BRIEF_JOBS === '1'
const MAX_TOTAL_CHARS = QUEUE_MODE ? 2_000_000 : 240_000
const PER_FILE_CAP_FOLDER = QUEUE_MODE ? 400_000 : 30_000   // when many files share the budget
const TEXT_EXTS = ['txt','md','markdown','csv','json','html','htm','rtf']

function ext(name) { return (name.split('.').pop() || '').toLowerCase() }
function fmtMB(n)  { return (n / (1024 * 1024)).toFixed(1) + ' MB' }

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

async function readPdf(file, onProgress) {
  const pdfjs = await loadPdfjs()
  const buf = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buf }).promise
  const total = pdf.numPages
  let out = ''
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    out += tc.items.map(it => it.str).join(' ') + '\n\n'
    if (onProgress) onProgress(i, total)
    // Stop only when we've collected more text than we can ever send.
    // The queue path uses MAX_TOTAL_CHARS = 2_000_000, so the early-exit
    // only fires on absurdly long PDFs.
    if (out.length > MAX_TOTAL_CHARS * 1.2) {
      out += `\n[…stopped reading at page ${i}/${total} — already collected enough text…]\n`
      break
    }
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

async function extractOne(file, onProgress) {
  const e = ext(file.name)
  if (TEXT_EXTS.includes(e))            return readPlain(file)
  if (e === 'pdf')                      return readPdf(file, onProgress)
  if (e === 'docx')                     return readDocx(file)
  if (e === 'doc')                      throw new Error('Legacy .doc not supported — convert to .docx first.')
  throw new Error(`Skipped (unsupported type .${e})`)
}

export default function FolderUploader({ onText, hint }) {
  const inputRef     = useRef(null)   // folder picker
  const fileInputRef = useRef(null)   // single-file picker
  const [files, setFiles]   = useState([])   // [{name, status, size, preview, error?}]
  const [busy, setBusy]     = useState(false)
  const [combined, setCombined] = useState('')
  const [mode, setMode]     = useState(null) // 'folder' | 'file' — what was last uploaded

  async function handleFiles(fileList) {
    const all = Array.from(fileList || [])
    if (!all.length) return
    setBusy(true)
    setFiles([])
    setCombined('')

    // Pre-filter: drop hidden/empty files, but DON'T silently swallow oversized
    // ones — surface them in the list so the user knows why they were skipped.
    const results = []
    const usable = []
    for (const f of all) {
      if (!f.name) continue
      const base = f.webkitRelativePath || f.name
      if (f.name.startsWith('.') || base.split('/').some(p => p.startsWith('.'))) {
        continue   // truly hidden system files — silent skip
      }
      if (f.size === 0) {
        results.push({ name: base, size: 0, status: 'error', error: 'Empty file (0 bytes)' })
        continue
      }
      if (f.size > MAX_FILE_BYTES) {
        results.push({
          name: base, size: f.size, status: 'error',
          error: `File is ${fmtMB(f.size)} — too large (max ${fmtMB(MAX_FILE_BYTES)}).`,
        })
        continue
      }
      usable.push(f)
    }
    if (usable.length > MAX_FILES) {
      // Mark the overflow ones as rejected for visibility.
      for (let i = MAX_FILES; i < usable.length; i++) {
        const f = usable[i]
        results.push({
          name: f.webkitRelativePath || f.name, size: f.size, status: 'error',
          error: `Skipped — only the first ${MAX_FILES} files of a folder are read.`,
        })
      }
      usable.length = MAX_FILES
    }
    setFiles([...results])

    // When the user uploaded a single file, give it the entire text budget;
    // when they uploaded a folder, share the budget across files.
    const singleFile     = usable.length === 1
    const perFileCharCap = singleFile ? MAX_TOTAL_CHARS : PER_FILE_CAP_FOLDER

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
        let text = await extractOne(file, (page, total) => {
          rec.preview = `Reading page ${page} / ${total}…`
          setFiles([...results])
        })
        if (!text) throw new Error('No readable text found in file (may be a scanned image — needs OCR).')

        // Trim per-file to keep total reasonable
        if (text.length > perFileCharCap) text = text.slice(0, perFileCharCap) + '\n[…truncated…]'
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
    setMode(null)
    if (inputRef.current)     inputRef.current.value     = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
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
          Upload a case folder — or a single file
        </div>
        <div style={{ fontSize: 11, color: '#5A5A5A', marginBottom: 14, lineHeight: 1.5, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
          {hint || 'AI reads every file (.pdf, .docx, .txt, .md, .csv, .html, .json), concatenates the content and uses it to draft your document. Choose a whole folder, or a single Word document / scanned PDF. Up to ' + MAX_FILES + ' files, ' + fmtMB(MAX_FILE_BYTES) + ' each.'}
        </div>

        {/* Folder picker (hidden) */}
        <input
          ref={inputRef}
          type="file"
          // @ts-ignore — non-standard but supported in all major browsers
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={e => { setMode('folder'); handleFiles(e.target.files) }}
        />
        {/* Single-file picker (hidden) — Word doc, scanned PDF, plain text, etc. */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.html,.htm,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/json,text/html"
          style={{ display: 'none' }}
          onChange={e => { setMode('file'); handleFiles(e.target.files) }}
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
            {busy && mode === 'folder' ? '⏳ Reading folder…' : '📂 Choose Folder'}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            style={{
              padding: '10px 18px',
              background: busy ? '#1C1C1C' : 'linear-gradient(135deg, #059669, #047857)',
              color: busy ? '#5A5A5A' : '#fff',
              border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            title="Upload a single Word document (.docx), scanned PDF, or any supported document"
          >
            {busy && mode === 'file' ? '⏳ Reading file…' : '📄 Choose Single File'}
          </button>
          {files.length > 0 && !busy && (
            <button type="button" onClick={clear}
              style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, color: '#9A9A9A', fontSize: 12, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: '#4A4A4A', lineHeight: 1.5 }}>
          Single-file accepts: <span style={{ color: '#7A7A7A' }}>.pdf · .docx · .txt · .md · .csv · .html · .json · .rtf</span>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#6A6A6A', marginBottom: 8 }}>
            <span>
              {mode === 'file' ? 'Single file' : `${stats.ok} of ${stats.total} read`}
              {stats.err > 0 && <span style={{ color: '#FF6B6B' }}> · {stats.err} failed</span>}
            </span>
            <span style={{ fontFamily: 'monospace', color: '#5A5A5A' }}>
              {(stats.chars / 1000).toFixed(1)}K chars extracted
            </span>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, maxHeight: 260, overflowY: 'auto' }}>
            {files.map((f, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                padding: '8px 12px',
                borderBottom: i < files.length - 1 ? '1px solid #1A1A1A' : 'none',
                fontSize: 11.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 16, textAlign: 'center' }}>
                    {f.status === 'reading' ? '⏳' :
                     f.status === 'ok'      ? '✅' :
                     f.status === 'partial' ? '✂️' :
                                              '❌'}
                  </span>
                  <span style={{ flex: 1, color: f.status === 'ok' ? '#C0C0C0' : f.status === 'reading' ? '#D4A017' : '#7A7A7A', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </span>
                  <span style={{ color: '#4A4A4A', fontFamily: 'monospace', fontSize: 10 }}>
                    {f.size > 1024 * 1024 ? fmtMB(f.size) : (f.size / 1024).toFixed(0) + ' KB'}
                  </span>
                </div>
                {f.status === 'reading' && f.preview && (
                  <div style={{ marginLeft: 26, color: '#A98019', fontSize: 10.5, fontFamily: 'monospace' }}>
                    {f.preview}
                  </div>
                )}
                {f.status === 'error' && f.error && (
                  <div style={{ marginLeft: 26, color: '#FF6B6B', fontSize: 10.5, lineHeight: 1.5 }}>
                    {f.error}
                  </div>
                )}
                {f.status === 'partial' && (
                  <div style={{ marginLeft: 26, color: '#D4A017', fontSize: 10.5 }}>
                    Truncated — file exceeded the combined-text budget.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
