import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbUrl = process.env.DATABASE_URL?.replace('file:', '') || './dev.db'
const dbPath = path.isAbsolute(dbUrl) ? dbUrl : path.resolve(process.cwd(), dbUrl)

try {
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
  if (fs.existsSync(dbPath)) {
    const bootstrap = new Database(dbPath)
    bootstrap.pragma('journal_mode = WAL')
    bootstrap.pragma('synchronous = NORMAL')
    bootstrap.pragma('busy_timeout = 5000')
    bootstrap.close()
  }
} catch (e) {
  console.warn('[db] PRAGMA bootstrap skipped:', (e as Error)?.message)
}

const adapter = new PrismaBetterSqlite3({ url: dbPath })

const prismaClientSingleton = () => {
  const client = new PrismaClient({ adapter })
  void client.$executeRawUnsafe('PRAGMA busy_timeout = 5000').catch(() => {})
  void client.$executeRawUnsafe('PRAGMA synchronous = NORMAL').catch(() => {})
  return client
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
