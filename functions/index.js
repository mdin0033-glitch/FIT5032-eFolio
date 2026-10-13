import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import cors from 'cors'
import { validateEmailPayload } from './email-validation.js'

initializeApp()
const db = getFirestore()
const allowCors = cors({ origin: true })
const sendGridApiKey = defineSecret('SENDGRID_API_KEY')
const sendGridFromEmail = defineString('SENDGRID_FROM_EMAIL', {
  description: 'Email address already verified as a SendGrid Single Sender.'
})

export const countBooks = onRequest(
  { region: 'us-central1', maxInstances: 2, invoker: 'public' },
  (req, res) => allowCors(req, res, async () => {
    if (req.method !== 'GET') {
      res.set('Allow', 'GET').status(405).json({ error: 'Use GET to count books.' })
      return
    }
    try {
      const snapshot = await db.collection('books').count().get()
      res.json({ count: snapshot.data().count })
    } catch {
      res.status(500).json({ error: 'Unable to count books.' })
    }
  })
)

// Only creation events are watched; updating the name cannot trigger this again.
export const capitaliseBook = onDocumentCreated(
  { document: 'books/{bookId}', region: 'us-central1', maxInstances: 2 },
  async (event) => {
    if (!event.data) return
    // Read the current document in a transaction so retries do not overwrite edits.
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(event.data.ref)
      if (!snapshot.exists) return
      const name = snapshot.data().name
      if (typeof name !== 'string' || name === name.toUpperCase()) return
      transaction.update(event.data.ref, { name: name.toUpperCase() })
    })
  }
)

export const getAllBooks = onRequest(
  { region: 'us-central1', maxInstances: 2, invoker: 'public' },
  (req, res) => allowCors(req, res, async () => {
    if (req.method !== 'GET') {
      res.set('Allow', 'GET').status(405).json({ error: 'Use GET to retrieve books.' })
      return
    }
    try {
      const snapshot = await db.collection('books').get()
      const books = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      res.json({ books })
    } catch {
      res.status(500).json({ error: 'Unable to retrieve books.' })
    }
  })
)

export const sendEmailWithAttachment = onCall(
  { region: 'australia-southeast2', secrets: [sendGridApiKey], maxInstances: 2, timeoutSeconds: 40 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in with Firebase before sending email.')
    if (!request.auth.token.email_verified) {
      throw new HttpsError('permission-denied', 'Verify your Firebase account email before sending email.')
    }
    let email
    try { email = validateEmailPayload(request.data) } catch (error) {
      throw new HttpsError('invalid-argument', error.message)
    }
    const now = Date.now()
    // Server-only quotas. Firestore rules must deny client access to this collection.
    const userLimit = db.collection('_emailRateLimits').doc(`user_${request.auth.uid}`)
    const globalLimit = db.collection('_emailRateLimits').doc('global')
    await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userLimit)
      const globalSnapshot = await transaction.get(globalLimit)
      const user = userSnapshot.data() || {}
      const global = globalSnapshot.data() || {}
      const userCount = now - (user.windowStart || 0) < 3600000 ? user.count || 0 : 0
      const globalCount = now - (global.windowStart || 0) < 3600000 ? global.count || 0 : 0
      if (now - (user.lastAttempt || 0) < 60000 || userCount >= 3 || globalCount >= 20) {
        throw new HttpsError('resource-exhausted', 'Email limit reached. Wait at least one minute; maximum three attempts per hour.')
      }
      transaction.set(userLimit, { windowStart: userCount ? user.windowStart : now, count: userCount + 1, lastAttempt: now })
      transaction.set(globalLimit, { windowStart: globalCount ? global.windowStart : now, count: globalCount + 1 })
    })
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST', signal: AbortSignal.timeout(20000),
        headers: { Authorization: `Bearer ${sendGridApiKey.value()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: email.recipient }] }],
          from: { email: sendGridFromEmail.value(), name: 'ClimateLearn Melbourne' },
          subject: email.subject, content: [{ type: 'text/plain', value: email.message }],
          attachments: [email.attachment]
        })
      })
      if (response.status !== 202) {
        // Do not log provider bodies, recipient details, attachments or credentials.
        throw new HttpsError('unavailable', 'The email service did not accept the message. Please try again later.')
      }
      return { accepted: true, message: 'SendGrid accepted your email. Delivery and attachment receipt must be checked in the recipient inbox.' }
    } catch (error) {
      if (error instanceof HttpsError) throw error
      throw new HttpsError('unavailable', 'Email request failed or timed out. Delivery is uncertain; check the recipient inbox before retrying.')
    }
  }
)
