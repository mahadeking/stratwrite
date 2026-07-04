/** Client-side document export helpers. Everything stays local (Blob download). */

export function sanitizeFilename(name: string): string {
  const base = (name || 'Untitled document').trim().replace(/[\\/:*?"<>|]+/g, '').slice(0, 80)
  return base || 'Untitled document'
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function buildHtmlDocument(title: string, bodyHtml: string): string {
  const safeTitle = title || 'Untitled document'
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(safeTitle)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 720px; margin: 48px auto; padding: 0 24px; line-height: 1.6; color: #1f2333; }
  h1 { font-size: 30px; } h2 { font-size: 24px; }
  a { color: #4f46e5; }
</style>
</head>
<body>
${bodyHtml || ''}
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Convert the editor's HTML into a reasonable Markdown approximation. */
export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html || '', 'text/html')

  const inline = (node: Node): string => {
    let out = ''
    node.childNodes.forEach((child) => {
      out += serialize(child)
    })
    return out
  }

  const serialize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as HTMLElement
    const inner = inline(el)
    switch (el.tagName) {
      case 'H1': return `# ${inner}\n\n`
      case 'H2': return `## ${inner}\n\n`
      case 'H3': return `### ${inner}\n\n`
      case 'STRONG':
      case 'B': return inner.trim() ? `**${inner}**` : inner
      case 'EM':
      case 'I': return inner.trim() ? `*${inner}*` : inner
      case 'A': return `[${inner}](${el.getAttribute('href') || ''})`
      case 'BR': return '\n'
      case 'LI': return inner
      case 'UL':
        return (
          Array.from(el.children)
            .map((li) => `- ${inline(li).trim()}`)
            .join('\n') + '\n\n'
        )
      case 'OL':
        return (
          Array.from(el.children)
            .map((li, i) => `${i + 1}. ${inline(li).trim()}`)
            .join('\n') + '\n\n'
        )
      case 'P':
      case 'DIV':
        return `${inner}\n\n`
      default:
        return inner
    }
  }

  return inline(doc.body).replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
