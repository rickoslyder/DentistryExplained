import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

// Collections
import { Articles } from './cms/collections/Articles'
import { Categories } from './cms/collections/Categories'
import { Media } from './cms/collections/Media'
import { References } from './cms/collections/References'
import { Users } from './cms/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Dentistry Explained CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.png',
    },
  },
  collections: [
    Articles,
    Categories,
    Media,
    References,
    Users,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'YOUR-SECRET-HERE',
  typescript: {
    outputFile: path.resolve(dirname, 'cms/payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  // Disable local file storage - we'll use Supabase Storage
  upload: {
    limits: {
      fileSize: 5000000, // 5MB
    },
  },
})