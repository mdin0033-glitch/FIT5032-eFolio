// Public responses use an explicit allowlist. Never spread Firestore fields here.
const text = (value, max = 300) => typeof value === 'string' ? value.slice(0, max) : ''
function dateText(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString()
  return text(value, 50)
}
export function publicResource(id, data) {
  return {
    id, isbn: typeof data.isbn === 'number' && Number.isFinite(data.isbn) ? data.isbn : text(data.isbn, 40),
    name: text(data.name, 200), category: text(data.category, 80) || 'Uncategorised',
    sample: data.sample === true
  }
}
export function publicEvent(id, data) {
  return {
    id, title: text(data.title, 200), category: text(data.category, 80) || 'Uncategorised',
    location: text(data.location, 250), date: dateText(data.date), status: text(data.status, 80) || 'Unspecified',
    sample: data.sample === true
  }
}
export function parsePublicQuery(query) {
  if (Object.keys(query).some(key => !['category', 'limit', 'cursor'].includes(key))) throw new Error('Supported query parameters: category, limit, cursor.')
  const limitText = query.limit === undefined ? '20' : query.limit
  if (typeof limitText !== 'string' || !/^[1-9]\d?$|^100$/.test(limitText)) throw new Error('limit must be an integer from 1 to 100.')
  for (const key of ['category', 'cursor']) {
    if (query[key] !== undefined && (typeof query[key] !== 'string' || !query[key].trim() || query[key].length > (key === 'category' ? 80 : 150))) {
      throw new Error(key + ' must be a non-empty text value within its length limit.')
    }
  }
  if (query.cursor?.includes('/')) throw new Error('cursor must be a document ID, without a slash.')
  return { limit: Number(limitText), category: query.category?.trim() || '', cursor: query.cursor || '' }
}
export function groupCounts(rows, key, fallback) {
  const groups = new Map()
  for (const row of rows) {
    const label = text(row[key], 80).trim() || fallback
    groups.set(label, (groups.get(label) || 0) + 1)
  }
  return [...groups].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
export function adminStatistics(resources, events, userCount) {
  const recent = rows => [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  return {
    totals: { resources: resources.length, events: events.length, users: userCount },
    resourcesByCategory: groupCounts(resources, 'category', 'Uncategorised'),
    eventsByStatus: groupCounts(events, 'status', 'Unspecified'),
    sampleTotals: { resources: resources.filter(row => row.sample).length, events: events.filter(row => row.sample).length },
    recentResources: recent(resources), recentEvents: recent(events), fetchedAt: new Date().toISOString()
  }
}
