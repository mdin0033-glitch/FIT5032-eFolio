export function readSaved(key, valid = () => true, storage) {
  try {
    const raw = (storage || globalThis.localStorage).getItem(key)
    if (!raw || raw.length > 2_000_000) return null
    const saved = JSON.parse(raw)
    return saved?.version === 1 && valid(saved.value) ? saved.value : null
  } catch { return null }
}
export function writeSaved(key, value, storage) {
  try {
    ;(storage || globalThis.localStorage).setItem(key, JSON.stringify({ version: 1, value }))
    return true
  } catch { return false }
}
export function tablePreferences(candidate, columns) {
  const keys = columns.map(column => column.key)
  const state = candidate && typeof candidate === 'object' ? candidate : {}
  const filters = {}
  for (const key of keys) if (typeof state.filters?.[key] === 'string') filters[key] = state.filters[key].slice(0, 200)
  return {
    search: typeof state.search === 'string' ? state.search.slice(0, 200) : '',
    filters, sortKey: keys.includes(state.sortKey) ? state.sortKey : keys[0],
    sortDirection: state.sortDirection === 'descending' ? 'descending' : 'ascending'
  }
}
