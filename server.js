import express from 'express'

const app = express()
app.get('/', (_req, res) => res.send('Hello from Node.js!'))
app.listen(3000, () => console.log('Node.js server running at http://localhost:3000'))
