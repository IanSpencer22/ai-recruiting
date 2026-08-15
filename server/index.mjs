import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateKit } from './generateKit.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const isProd = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || (isProd ? 8080 : 3001))

const app = express()
app.use(express.json({ limit: '32kb' }))

app.post('/api/interview-kit', async (req, res) => {
  const jobTitle = String(req.body?.jobTitle ?? '').trim()
  const level = String(req.body?.level ?? '').trim()
  const focus = String(req.body?.focus ?? '').trim() || undefined

  if (!jobTitle || !level) {
    res.status(400).json({ error: 'jobTitle and level are required' })
    return
  }

  try {
    const kit = await generateKit({ jobTitle, level, focus })
    res.json(kit)
  } catch (err) {
    if (err?.code === 'NO_KEY') {
      res.status(503).json({ error: 'OpenAI not configured' })
      return
    }
    console.error('Interview kit generation failed')
    res.status(500).json({ error: 'Generation failed' })
  }
})

if (isProd) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(port, '0.0.0.0', () => {
  console.log(`TalentPulse server listening on ${port}`)
})
