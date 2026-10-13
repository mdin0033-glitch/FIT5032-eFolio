import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldPath } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { publicResource, publicEvent, parsePublicQuery, adminStatistics } from './public-data.js'
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

function publicCollectionEndpoint(collectionName, responseKey, project) {
  return onRequest(
    { region: 'australia-southeast2', maxInstances: 2, invoker: 'public', timeoutSeconds: 30 },
    (req, res) => allowCors(req, res, async () => {
      if (req.method !== 'GET') {
        res.set('Allow', 'GET').status(405).json({ error: 'This endpoint only accepts GET.' })
        return
      }
      let options
      try { options = parsePublicQuery(req.query) } catch (error) {
        res.status(400).json({ error: error.message })
        return
      }
      try {
        let query = db.collection(collectionName).orderBy(FieldPath.documentId())
        if (options.category) query = query.where('category', '==', options.category)
        if (options.cursor) query = query.startAfter(options.cursor)
        const snapshot = await query.limit(options.limit + 1).get()
        const documents = snapshot.docs.slice(0, options.limit)
        res.set('Cache-Control', 'public, max-age=60').json({
          [responseKey]: documents.map(document => project(document.id, document.data())),
          count: documents.length, limit: options.limit,
          nextCursor: snapshot.docs.length > options.limit ? documents.at(-1).id : null
        })
      } catch {
        res.status(500).json({ error: 'Public data is temporarily unavailable.' })
      }
    })
  )
}
export const getPublicResources = publicCollectionEndpoint('books', 'resources', publicResource)
export const getPublicEvents = publicCollectionEndpoint('events', 'events', publicEvent)

export const getAdminStatistics = onCall(
  { region: 'australia-southeast2', maxInstances: 2, timeoutSeconds: 60 },
  async request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to access administrator statistics.')
    if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Administrator access is required.')
    try {
      const [resourcesSnapshot, eventsSnapshot] = await Promise.all([
        db.collection('books').get(), db.collection('events').get()
      ])
      const records = (snapshot, project) => snapshot.docs.map(document => ({
        ...project(document.id, document.data()), createdAt: document.createTime.toDate().toISOString()
      }))
      let userCount = 0
      try {
        let pageToken
        do {
          const page = await getAuth().listUsers(1000, pageToken)
          userCount += page.users.length
          pageToken = page.pageToken
        } while (pageToken)
      } catch { userCount = null }
      return adminStatistics(records(resourcesSnapshot, publicResource), records(eventsSnapshot, publicEvent), userCount)
    } catch {
      throw new HttpsError('unavailable', 'Administrator statistics are temporarily unavailable.')
    }
  }
)
