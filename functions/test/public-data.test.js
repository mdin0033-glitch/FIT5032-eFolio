import test from 'node:test'
import assert from 'node:assert/strict'
import { publicResource, publicEvent, parsePublicQuery, adminStatistics } from '../public-data.js'

test('public projections exclude private and unexpected fields and preserve numeric ISBN', () => {
  const privateFields = { email: 'private@example.invalid', password: 'private', token: 'private', ownerUid: 'private' }
  const resource = publicResource('r1', { ...privateFields, isbn: 5678, name: 'BOOK', category: 'Climate', sample: true })
  const event = publicEvent('e1', { ...privateFields, title: 'Learning', location: 'Melbourne', status: 'Planned' })
  assert.deepEqual(Object.keys(resource), ['id', 'isbn', 'name', 'category', 'sample'])
  assert.deepEqual(Object.keys(event), ['id', 'title', 'category', 'location', 'date', 'status', 'sample'])
  assert.equal(resource.isbn, 5678)
  assert.equal(JSON.stringify([resource, event]).includes('private'), false)
})
test('public queries enforce bounds and reject arrays and malformed cursors', () => {
  assert.deepEqual(parsePublicQuery({}), { limit: 20, category: '', cursor: '' })
  assert.equal(parsePublicQuery({ limit: '100', category: 'Climate' }).limit, 100)
  for (const query of [{ limit: '0' }, { limit: '101' }, { limit: '1.5' }, { limit: ['2'] }, { cursor: 'a/b' }, { category: '' }, { unknown: 'x' }]) {
    assert.throws(() => parsePublicQuery(query))
  }
})
test('dashboard aggregates reflect input records and actual creation times', () => {
  const resources = [
    { id: 'a', category: 'Climate', sample: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'b', category: 'Climate', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'c', category: '', createdAt: '2026-09-01T00:00:00Z' }
  ]
  const result = adminStatistics(resources, [{ id: 'd', status: 'Planned', createdAt: '2026-10-01T00:00:00Z' }], 7)
  assert.deepEqual(result.totals, { resources: 3, events: 1, users: 7 })
  assert.equal(result.resourcesByCategory.reduce((total, row) => total + row.count, 0), 3)
  assert.equal(result.recentResources[0].id, 'b')
  assert.deepEqual(result.sampleTotals, { resources: 1, events: 0 })
})
