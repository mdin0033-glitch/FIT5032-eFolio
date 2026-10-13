export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const types = { pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv' }
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

export function validateEmailPayload(data) {
  if (!data || typeof data !== 'object') throw new Error('Email details are required.')
  const recipient = typeof data.recipient === 'string' ? data.recipient.trim() : ''
  const subject = typeof data.subject === 'string' ? data.subject.trim() : ''
  const message = typeof data.message === 'string' ? data.message.trim() : ''
  if (recipient.length > 254 || !emailPattern.test(recipient)) throw new Error('Enter one valid recipient email address.')
  if (!subject || subject.length > 150 || /[\r\n]/.test(subject)) throw new Error('Subject must contain 1–150 characters on one line.')
  if (!message || message.length > 10000) throw new Error('Message must contain 1–10,000 characters.')
  const attachment = data.attachment
  if (!attachment || typeof attachment.name !== 'string' || typeof attachment.content !== 'string') {
    throw new Error('Select one PDF, TXT or CSV attachment.')
  }
  const filename = attachment.name.trim()
  const extension = filename.split('.').pop().toLowerCase()
  if (!types[extension] || filename.length > 120 || !/^[^/\\\x00-\x1f\x7f]+$/.test(filename)) {
    throw new Error('Use a PDF, TXT or CSV filename without path separators or control characters.')
  }
  if (!attachment.content || attachment.content.length > 4 * Math.ceil(MAX_ATTACHMENT_BYTES / 3) ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(attachment.content)) {
    throw new Error('Attachment is invalid or larger than 2 MiB.')
  }
  const bytes = Buffer.from(attachment.content, 'base64')
  if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES || bytes.toString('base64') !== attachment.content) {
    throw new Error('Attachment is empty, invalid or larger than 2 MiB.')
  }
  if (extension === 'pdf' && bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('The PDF attachment does not have a valid PDF header.')
  }
  if (extension !== 'pdf') {
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch {
      throw new Error('TXT and CSV attachments must use UTF-8 encoding.')
    }
    if (bytes.includes(0)) throw new Error('TXT and CSV attachments must contain text, not binary data.')
  }
  // Decode and re-encode on the server; never trust browser-supplied MIME metadata.
  return { recipient, subject, message, attachment: {
    content: bytes.toString('base64'), filename, type: types[extension], disposition: 'attachment'
  } }
}
