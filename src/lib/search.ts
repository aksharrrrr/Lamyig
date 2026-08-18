export function matchesJourneySearch(candidate: string, rawQuery: string): boolean {
  const candidateTokens = normalizeTokens(candidate)
  const queryTokens = normalizeTokens(rawQuery)
  return queryTokens.length > 0 && queryTokens.every((queryToken) => (
    candidateTokens.some((candidateToken) => candidateToken.includes(queryToken))
  ))
}

function normalizeTokens(value: string): string[] {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.length > 4 && token.endsWith('s') ? token.slice(0, -1) : token)
}
