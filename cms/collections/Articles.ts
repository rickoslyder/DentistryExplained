import { CollectionConfig } from 'payload/types'
import { createRichTextField } from '../fields/richText'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'status', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: {
        description: 'Brief summary for search results and previews',
      },
    },
    createRichTextField('content', 'Article Content', true),
    {
      name: 'difficultyLevel',
      type: 'select',
      defaultValue: 'basic',
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Advanced', value: 'advanced' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'medicalReviewer',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status !== 'draft',
      },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: {
        condition: (data) => data?.status === 'in_review',
        description: 'Notes from medical reviewer',
      },
    },
    {
      name: 'lastMedicalReview',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'references',
      type: 'relationship',
      relationTo: 'references',
      hasMany: true,
    },
    {
      name: 'relatedArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      maxRows: 5,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    // SEO Fields
    {
      name: 'meta',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          maxLength: 60,
        },
        {
          name: 'description',
          type: 'textarea',
          maxLength: 160,
        },
        {
          name: 'keywords',
          type: 'text',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-calculate read time based on content
        if (data?.content) {
          const plainText = extractPlainText(data.content)
          const wordCount = plainText.split(/\s+/).length
          const readTime = Math.ceil(wordCount / 200) // 200 words per minute
          data.readTime = readTime
        }

        // Handle status transitions
        if (operation === 'update' && data?.status) {
          const previousStatus = req.payload.findByID({ 
            collection: 'articles', 
            id: req.params.id 
          }).status

          // Log status changes for audit trail
          if (previousStatus !== data.status) {
            console.log(`Article ${req.params.id} status changed from ${previousStatus} to ${data.status}`)
            
            // Set reviewer when moving to review
            if (data.status === 'in_review' && !data.medicalReviewer) {
              // In production, this would assign based on availability/specialty
              data.medicalReviewer = req.user.id
            }
            
            // Set review date when approved
            if (data.status === 'approved') {
              data.lastMedicalReview = new Date()
            }
          }
        }

        return data
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) {
        // Public can only see published articles
        return {
          status: {
            equals: 'published',
          },
        }
      }
      // Logged in users can see more based on role
      return true
    },
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'content-creator',
    update: ({ req: { user }, data }) => {
      if (!user) return false
      
      // Admins can update anything
      if (user.role === 'admin') return true
      
      // Authors can update their own drafts
      if (user.role === 'content-creator' && data?.author === user.id && data?.status === 'draft') {
        return true
      }
      
      // Reviewers can update articles in review
      if (user.role === 'medical-reviewer' && ['pending_review', 'in_review'].includes(data?.status)) {
        return true
      }
      
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}

// Helper function to extract plain text from rich text
function extractPlainText(richText: any): string {
  // This is a simplified version - in production, you'd properly parse the Lexical JSON
  if (typeof richText === 'string') return richText
  
  // Rough extraction for Lexical rich text
  let text = ''
  if (richText?.root?.children) {
    richText.root.children.forEach((node: any) => {
      if (node.children) {
        node.children.forEach((child: any) => {
          if (child.text) text += child.text + ' '
        })
      }
    })
  }
  
  return text
}