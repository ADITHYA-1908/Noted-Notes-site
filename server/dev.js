import process from 'node:process'
import app, { databaseType } from './index.js'

const port = Number(process.env.PORT) || 3001

app.listen(port, () => console.log(`Noted running on port ${port} with ${databaseType}`))
