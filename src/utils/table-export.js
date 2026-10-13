import { makeCsv, cellText } from './table-data'

export function downloadCsv(columns, rows, filename) {
  const url = URL.createObjectURL(new Blob([makeCsv(columns, rows)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename + '.csv'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadPdf(columns, rows, title, filename) {
  // Load the export libraries only when a PDF is requested.
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdf.setProperties({ title, author: 'ClimateLearn Melbourne' })
  pdf.setFontSize(16)
  pdf.text(title, 14, 16)
  pdf.setFontSize(10)
  pdf.text('ClimateLearn Melbourne | ' + rows.length + ' filtered records | ' + new Date().toLocaleDateString('en-AU'), 14, 24)
  autoTable(pdf, {
    startY: 30,
    head: [columns.map(column => column.label)],
    body: rows.map(row => columns.map(column => cellText(row[column.key]))),
    theme: 'striped',
    styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 3 },
    headStyles: { fillColor: [20, 83, 45] },
    margin: { top: 14, right: 14, bottom: 18, left: 14 },
    didDrawPage: ({ pageNumber }) => {
      pdf.setFontSize(9)
      pdf.text('Page ' + pageNumber, 14, pdf.internal.pageSize.getHeight() - 8)
    }
  })
  pdf.save(filename + '.pdf')
}
