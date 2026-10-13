import test from 'node:test'
import assert from 'node:assert/strict'
import { readSaved, writeSaved, tablePreferences } from '../src/utils/browser-storage.js'
test('saved state survives reload and malformed or inaccessible storage falls back safely', () => {
  const store = new Map()
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) }
  assert.equal(writeSaved('key', { ids: ['r1'] }, storage), true)
  assert.deepEqual(readSaved('key', value => Array.isArray(value.ids), storage), { ids: ['r1'] })
  store.set('key', '{corrupt')
  assert.equal(readSaved('key', undefined, storage), null)
  const blocked = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('full') } }
  assert.equal(readSaved('key', undefined, blocked), null)
  assert.equal(writeSaved('key', {}, blocked), false)
})
test('persisted table state is limited to current columns and valid sorting', () => {
  const columns = [{ key: 'name' }, { key: 'category' }]
  const prefs = tablePreferences({ search: 'climate', sortKey: 'removed-field', sortDirection: 'bad', filters: { category: 'Water', private: 'ignored' } }, columns)
  assert.deepEqual(prefs, { search: 'climate', filters: { category: 'Water' }, sortKey: 'name', sortDirection: 'ascending' })
})
