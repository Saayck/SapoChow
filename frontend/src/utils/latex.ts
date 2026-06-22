import katex from 'katex'

export function renderLatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'html',
    })
  } catch {
    return `<span class="text-red-500 text-sm">LaTeX inválido</span>`
  }
}

export function isValidLatex(latex: string): boolean {
  try {
    katex.renderToString(latex, { throwOnError: true })
    return true
  } catch {
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const MATH_RE = /\\\((.+?)\\\)|\\\[(.+?)\\\]|\$\$(.+?)\$\$|\$([^$\n]+?)\$/gs

const LATEX_COMMAND_RE = /\\(?:[a-zA-Z]+|[(){}[\],;.!?\\\s])/

/**
 * Render a string that may contain plain text mixed with LaTeX delimiters
 * (\(...\), \[...\], $...$, $$...$$). Text segments are HTML-escaped;
 * math segments are rendered with KaTeX. If the input lacks delimiters but
 * looks like raw LaTeX (contains a backslash command), we render the whole
 * thing as math as a best-effort fallback.
 */
export function renderMixedLatex(input: string | null | undefined): string {
  if (!input) return ''
  let out = ''
  let lastIndex = 0
  let match: RegExpExecArray | null
  let matched = false
  MATH_RE.lastIndex = 0
  while ((match = MATH_RE.exec(input)) !== null) {
    matched = true
    if (match.index > lastIndex) {
      out += escapeHtml(input.slice(lastIndex, match.index))
    }
    const inline = match[1] ?? match[4]
    const display = match[2] ?? match[3]
    const body = (inline ?? display ?? '').trim()
    const isDisplay = display !== undefined
    out += renderLatex(body, isDisplay)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < input.length) {
    out += escapeHtml(input.slice(lastIndex))
  }
  if (!matched && LATEX_COMMAND_RE.test(input)) {
    return renderLatex(input.trim(), false)
  }
  return out
}

/**
 * Render an item that has both a text and a latex field. If only latex is set
 * it is rendered as a standalone expression. If text is set it may itself
 * contain inline math delimiters (handled by renderMixedLatex).
 */
export function renderContent(opts: {
  text?: string | null
  latex?: string | null
  displayLatex?: boolean
}): string {
  const { text, latex, displayLatex = false } = opts
  if (text && text.trim()) return renderMixedLatex(text)
  if (latex && latex.trim()) return renderLatex(latex, displayLatex)
  return ''
}
