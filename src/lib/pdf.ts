/**
 * Renders lightweight markdown (## headings, - bullets, **bold**, blank-line
 * paragraphs) to HTML. Just enough for AI-generated plan text — not a
 * general-purpose parser.
 */
export function markdownToHtml(markdown: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = (s: string) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  const lines = markdown.split('\n')
  const html: string[] = []
  let inList = false

  function closeList() {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      closeList()
      continue
    }
    if (line.startsWith('## ')) {
      closeList()
      html.push(`<h2>${inline(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      closeList()
      html.push(`<h1>${inline(line.slice(2))}</h1>`)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${inline(line.slice(2))}</li>`)
    } else {
      closeList()
      html.push(`<p>${inline(line)}</p>`)
    }
  }
  closeList()
  return html.join('\n')
}

export function printAsPdf(title: string, markdown: string, lang: 'ar' | 'en'): void {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const win = window.open('', '_blank')
  if (!win) return

  win.document.write(`<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&family=Inter:wght@400;600;800&display=swap');
  body { font-family: ${lang === 'ar' ? "'Cairo'" : "'Inter'"}, system-ui, sans-serif; color: #16181a; max-width: 720px; margin: 40px auto; padding: 0 24px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
  h2 { font-size: 16px; font-weight: 800; margin: 28px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #a6e617; }
  h2:first-of-type { margin-top: 12px; }
  p { margin: 6px 0; font-size: 13.5px; }
  ul { margin: 4px 0 12px; padding-inline-start: 20px; }
  li { font-size: 13.5px; margin: 3px 0; }
  strong { color: #547b08; }
  .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
  @media print { body { margin: 0; padding: 16px; } }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">FitForge — ${new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US')}</p>
${markdownToHtml(markdown)}
</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}
