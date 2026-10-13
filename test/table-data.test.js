import test from 'node:test'
import assert from 'node:assert/strict'
import { filterRows, sortRows, makeCsv } from '../src/utils/table-data.js'

const columns = [{ key: 'isbn', label: 'ISBN' }, { key: 'name', label: 'Resource name' }, { key: 'category', label: 'Category' }]
const rows = [{ isbn: 20, name: 'Water, cities', category: 'Water' }, { isbn: 3, name: 'Climate basics', category: 'Science' }, { isbn: 100, name: 'Climate action', category: 'Community' }]

test('global and column searches intersect, ignore case and trim input', () => {
  assert.deepEqual(filterRows(rows, columns, ' CLIMATE ', { category: 'community' }), [rows[2]])
  assert.equal(filterRows(rows, columns, 'missing').length, 0)
  assert.equal(filterRows(rows, columns, '', {}).length, 3)
})
test('numeric ISBN sorting works without mutating Firestore data', () => {
  assert.deepEqual(sortRows(rows, 'isbn').map(row => row.isbn), [3, 20, 100])
  assert.deepEqual(sortRows(rows, 'isbn', 'descending').map(row => row.isbn), [100, 20, 3])
  assert.equal(rows[0].isbn, 20)
})
test('CSV exports UTF-8 BOM, quoted commas/newlines and escaped quotes', () => {
  const csv = makeCsv([{ key: 'name', label: 'Name' }], [{ name: 'Water, "cities"\nMelbourne' }, { name: 'café' }])
  assert.ok(csv.startsWith('\uFEFF"Name"\r\n'))
  assert.ok(csv.includes('"Water, ""cities""\nMelbourne"'))
  assert.ok(csv.includes('café'))
  assert.ok(!csv.includes('undefined'))
})
test('CSV neutralises spreadsheet formula injection and missing fields', () => {
  const csv = makeCsv([{ key: 'name', label: 'Name' }], [{ name: '=HYPERLINK("evil")' }, { name: '  +123' }, { name: '@SUM(1)' }, {}])
  assert.ok(csv.includes("'="))
  assert.ok(csv.includes("'  +123"))
  assert.ok(csv.includes("'@SUM"))
  assert.ok(csv.endsWith('""\r\n'))
})
