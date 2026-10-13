// Shared data operations keep the two tables and their exports consistent.
export function cellText(value) {
  return value == null ? '' : String(value)
}

export function filterRows(rows, columns, search = '', filters = {}) {
  const term = search.trim().toLocaleLowerCase('en-AU')
  return rows.filter(row =>
    (!term || columns.some(column => cellText(row[column.key]).toLocaleLowerCase('en-AU').includes(term))) &&
    columns.every(column => cellText(row[column.key]).toLocaleLowerCase('en-AU').includes(
      cellText(filters[column.key]).trim().toLocaleLowerCase('en-AU')
    ))
  )
}

export function sortRows(rows, key, direction = 'ascending') {
  return [...rows].sort((a, b) => {
    const left = a[key]
    const right = b[key]
    const comparison = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : cellText(left).localeCompare(cellText(right), 'en-AU', { numeric: true, sensitivity: 'base' })
    return direction === 'ascending' ? comparison : -comparison
  })
}

export function csvCell(value) {
  let text = cellText(value)
  // A quoted CSV cell can still execute a spreadsheet formula. Neutralise it.
  if (/^[\s]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}

export function makeCsv(columns, rows) {
  return '\uFEFF' + [
    columns.map(column => csvCell(column.label)).join(','),
    ...rows.map(row => columns.map(column => csvCell(row[column.key])).join(','))
  ].join('\r\n') + '\r\n'
}
