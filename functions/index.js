import { onRequest } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import cors from 'cors'

initializeApp()
const db = getFirestore()
const allowCors = cors({ origin: true })

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
