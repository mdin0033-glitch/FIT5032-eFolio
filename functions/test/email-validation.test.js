import test from 'node:test'
import assert from 'node:assert/strict'
import { validateEmailPayload, MAX_ATTACHMENT_BYTES } from '../email-validation.js'

const payload = () => ({ recipient: 'recipient@example.com', subject: 'A resource', message: 'Climate literacy notes.',
  attachment: { name: 'notes.txt', content: Buffer.from('Reduce, reuse and recycle.').toString('base64') } })

test('valid UTF-8 text attachment is decoded and formatted for SendGrid', () => {
  const email = validateEmailPayload(payload())
  assert.equal(email.attachment.type, 'text/plain')
  assert.equal(Buffer.from(email.attachment.content, 'base64').toString(), 'Reduce, reuse and recycle.')
  assert.equal(email.attachment.disposition, 'attachment')
})
test('invalid addresses, header injection and empty messages are rejected', () => {
  for (const recipient of ['', 'not-an-email', 'a@example.com,b@example.com']) {
    assert.throws(() => validateEmailPayload({ ...payload(), recipient }))
  }
  assert.throws(() => validateEmailPayload({ ...payload(), subject: 'Hi\r\nBcc: other@example.com' }))
  assert.throws(() => validateEmailPayload({ ...payload(), message: ' ' }))
})
test('missing, empty, unsupported and path-containing attachments are rejected', () => {
  assert.throws(() => validateEmailPayload({ ...payload(), attachment: null }))
  for (const name of ['script.exe', '../notes.txt', 'notes\n.txt']) {
    assert.throws(() => validateEmailPayload({ ...payload(), attachment: { ...payload().attachment, name } }))
  }
  assert.throws(() => validateEmailPayload({ ...payload(), attachment: { name: 'empty.txt', content: '' } }))
})
test('oversized and malformed base64 attachments are rejected', () => {
  const large = Buffer.alloc(MAX_ATTACHMENT_BYTES + 1, 'x').toString('base64')
  assert.throws(() => validateEmailPayload({ ...payload(), attachment: { name: 'large.txt', content: large } }))
  assert.throws(() => validateEmailPayload({ ...payload(), attachment: { name: 'bad.txt', content: '???' } }))
})
test('fake PDFs and binary text files are rejected; valid PDF header is accepted', () => {
  assert.throws(() => validateEmailPayload({ ...payload(), attachment: { ...payload().attachment, name: 'fake.pdf' } }))
  assert.throws(() => validateEmailPayload({ ...payload(), attachment: { name: 'binary.txt', content: Buffer.from([0, 255]).toString('base64') } }))
  assert.equal(validateEmailPayload({ ...payload(), attachment: { name: 'document.pdf', content: Buffer.from('%PDF-1.4\n').toString('base64') } }).attachment.type, 'application/pdf')
})
