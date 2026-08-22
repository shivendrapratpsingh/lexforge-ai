// ─────────────────────────────────────────────────────────────────
//  What a LexForge email looks like.
//
//  The app is dark. The email deliberately is not, and that is a
//  decision rather than an inconsistency.
//
//  A dark HTML email does not survive contact with real mail clients.
//  Gmail on a phone re-colours dark messages toward its own scheme, and
//  the first version of these templates — a dark card, carefully styled —
//  arrived as a white box with grey text, looking like a mistake rather
//  than a design. You cannot control the canvas, so the only reliable
//  move is to paint one that already agrees with the client's default.
//
//  So: a letterhead. Ivory, ink, a gold rule, and a serif wordmark. For
//  a legal product that reads as more considered than the dark UI would
//  have anyway — a notice from a chambers rather than a notification
//  from an app — and it renders identically in Gmail, Outlook and Apple
//  Mail, in either colour scheme.
//
//  Email HTML is 1999 HTML. Tables for layout, inline styles only, no
//  flexbox, no <style> block (Gmail strips it), no external anything.
// ─────────────────────────────────────────────────────────────────

const C = {
  page: '#F2EFE9',        // the paper the letter sits on
  card: '#FFFFFF',
  rule: '#E4DFD5',
  ink: '#1C1917',         // headings
  body: '#4A453E',        // 8.9:1 on white
  muted: '#7A7268',       // 4.6:1 — the floor for anything readable
  gold: '#8F6608',        // 4.94:1 on white; the app's #D4A017 fails on light
  goldBar: '#B8860B',     // decorative only, never carries text
  good: '#1B6E3C',
  warn: '#9A3412',
}

const SERIF = "Georgia, 'Times New Roman', Times, serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export const COLORS = C

/** A heading, in the serif that carries the legal register. */
export const h1 = (text) =>
  `<h1 style="margin:0 0 18px;font-family:${SERIF};font-size:24px;line-height:1.3;font-weight:normal;color:${C.ink};letter-spacing:-0.2px;">${text}</h1>`

export const p = (text, { muted = false } = {}) =>
  `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.75;color:${muted ? C.muted : C.body};">${text}</p>`

/** A hairline. Two columns of nothing, because <hr> renders differently everywhere. */
export const rule = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;"><tr><td style="border-top:1px solid ${C.rule};font-size:0;line-height:0;">&nbsp;</td></tr></table>`

/**
 * Label-and-value rows. The part of a receipt someone actually reads,
 * so the value is set in a tabular figure style and right-aligned to
 * make the column scan.
 */
export const facts = (rows) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;border-top:1px solid ${C.rule};">
  ${rows.filter(Boolean).map(([k, v, strong]) => `
  <tr>
    <td style="padding:11px 0;font-family:${SANS};font-size:13px;color:${C.muted};border-bottom:1px solid ${C.rule};">${k}</td>
    <td style="padding:11px 0;font-family:${SANS};font-size:${strong ? '15px' : '13.5px'};font-weight:${strong ? '700' : '400'};color:${strong ? C.ink : C.body};text-align:right;border-bottom:1px solid ${C.rule};">${v}</td>
  </tr>`).join('')}
</table>`

/** A bordered aside. Tone carries meaning, never colour alone — each one
 *  opens with a bold lead-in so it still reads without colour. */
export const note = (html, tone = 'gold') => {
  const edge = tone === 'good' ? C.good : tone === 'warn' ? C.warn : C.goldBar
  const bg = tone === 'good' ? '#F1F7F3' : tone === 'warn' ? '#FDF4EF' : '#FBF7EC'
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
  <tr><td style="border-left:3px solid ${edge};background:${bg};padding:14px 18px;font-family:${SANS};font-size:14px;line-height:1.7;color:${C.body};">${html}</td></tr>
</table>`
}

/** A button that is a table, because Outlook ignores padding on anchors. */
export const button = (label, href) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">
  <tr><td style="background:${C.goldBar};border-radius:6px;">
    <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.2px;">${label}</a>
  </td></tr>
</table>`

/**
 * The whole letter.
 *
 * `preheader` is the grey line an inbox shows after the subject. Left
 * unset, clients scrape the first text they find — which is usually the
 * word "LexForge" from the letterhead, wasting the one line of preview
 * anybody reads before deciding to open.
 */
export function emailShell({ title, preheader = '', body, site = 'https://lexforge-ai.vercel.app' }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${C.page};">

<div style="display:none;font-size:1px;color:${C.page};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
<tr><td align="center" style="padding:30px 10px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

    <tr><td style="height:3px;background:${C.goldBar};font-size:0;line-height:0;border-radius:3px 3px 0 0;">&nbsp;</td></tr>

    <tr><td style="background:${C.card};border:1px solid ${C.rule};border-top:none;padding:36px 30px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
        <tr>
          <td width="42" valign="middle">
            <div style="width:38px;height:38px;background:${C.goldBar};border-radius:7px;text-align:center;">
              <span style="font-family:${SERIF};font-size:16px;font-weight:bold;color:#FFFFFF;line-height:38px;letter-spacing:0.5px;">LF</span>
            </div>
          </td>
          <td valign="middle" style="padding-left:13px;">
            <div style="font-family:${SERIF};font-size:19px;color:${C.ink};letter-spacing:0.3px;">LexForge&nbsp;AI</div>
            <div style="font-family:${SANS};font-size:10.5px;color:${C.muted};letter-spacing:1.6px;text-transform:uppercase;padding-top:3px;">Indian Legal Drafting</div>
          </td>
        </tr>
      </table>

      ${body}

    </td></tr>

    <tr><td style="padding:20px 30px 0;">
      <p style="margin:0 0 10px;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.muted};">
        <a href="${site}/pricing" style="color:${C.muted};text-decoration:none;">Pricing</a>
        &nbsp;·&nbsp;
        <a href="${site}/terms" style="color:${C.muted};text-decoration:none;">Terms</a>
        &nbsp;·&nbsp;
        <a href="${site}/privacy" style="color:${C.muted};text-decoration:none;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="${site}/contact" style="color:${C.muted};text-decoration:none;">Contact</a>
      </p>
      <p style="margin:0;font-family:${SANS};font-size:11.5px;line-height:1.7;color:${C.muted};">
        LexForge drafts documents for a qualified person to check. It is not a law
        firm and does not give legal advice.
      </p>
    </td></tr>

  </table>

</td></tr></table>
</body></html>`
}
