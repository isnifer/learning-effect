import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'
import StartHttpServer from '#/server/entrypoints/http/StartHttpServer'

const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 3000)
const isProduction = process.env.NODE_ENV === 'production'

const vite = isProduction
  ? undefined
  : await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
const httpServer = await StartHttpServer({
  host,
  port,
  staticDirectory: isProduction ? fileURLToPath(new URL('../dist', import.meta.url)) : undefined,
  fallback: vite ? (request, response) => vite.middlewares(request, response) : undefined,
})

console.log(`Server listening on ${httpServer.url}`)

async function shutdown() {
  await httpServer.close()
  await vite?.close()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
