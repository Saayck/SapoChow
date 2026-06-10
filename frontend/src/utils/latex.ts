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
