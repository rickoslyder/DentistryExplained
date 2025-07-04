import { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 432,
        position: 'centre',
      },
      {
        name: 'feature',
        width: 1280,
        height: 720,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'mediaType',
      type: 'select',
      defaultValue: 'illustration',
      options: [
        { label: 'Illustration', value: 'illustration' },
        { label: 'Clinical Photo', value: 'clinical' },
        { label: 'Diagram', value: 'diagram' },
        { label: 'X-Ray', value: 'xray' },
        { label: 'Document', value: 'document' },
      ],
    },
    {
      name: 'copyright',
      type: 'group',
      fields: [
        {
          name: 'owner',
          type: 'text',
        },
        {
          name: 'license',
          type: 'select',
          options: [
            { label: 'Copyright - All Rights Reserved', value: 'copyright' },
            { label: 'Creative Commons - Attribution', value: 'cc-by' },
            { label: 'Creative Commons - Attribution ShareAlike', value: 'cc-by-sa' },
            { label: 'Public Domain', value: 'public-domain' },
          ],
        },
        {
          name: 'attribution',
          type: 'text',
          admin: {
            description: 'How to attribute this image when used',
          },
        },
      ],
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
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'content-creator',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'content-creator',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}