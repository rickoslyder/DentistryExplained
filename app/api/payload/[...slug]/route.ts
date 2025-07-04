import { getPayload } from 'payload'
import { NextRequest } from 'next/server'
import config from '@/payload.config'

// Initialize Payload
let payload: any = null

async function initPayload() {
  if (!payload) {
    payload = await getPayload({ config })
  }
  return payload
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const payloadInstance = await initPayload()
    const path = params.slug.join('/')
    
    // Handle different endpoints
    if (path === 'articles') {
      const articles = await payloadInstance.find({
        collection: 'articles',
        where: {
          status: {
            equals: 'published',
          },
        },
        limit: 100,
      })
      
      return Response.json(articles)
    }
    
    if (path === 'categories') {
      const categories = await payloadInstance.find({
        collection: 'categories',
        limit: 100,
      })
      
      return Response.json(categories)
    }
    
    // Handle article by slug
    if (path.startsWith('articles/')) {
      const slug = path.replace('articles/', '')
      const article = await payloadInstance.find({
        collection: 'articles',
        where: {
          slug: {
            equals: slug,
          },
          status: {
            equals: 'published',
          },
        },
        limit: 1,
      })
      
      if (article.docs.length === 0) {
        return Response.json({ error: 'Article not found' }, { status: 404 })
      }
      
      return Response.json(article.docs[0])
    }
    
    return Response.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    console.error('Payload API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle other HTTP methods as needed
export async function POST(request: NextRequest) {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(request: NextRequest) {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}