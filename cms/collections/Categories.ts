import { CollectionConfig } from 'payload/types'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
  },
  fields: [
    {
      name: 'name',
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Select a parent category to create a hierarchy',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order for displaying categories',
      },
    },
    {
      name: 'icon',
      type: 'select',
      options: [
        { label: 'Tooth', value: 'tooth' },
        { label: 'Shield', value: 'shield' },
        { label: 'Alert Circle', value: 'alert-circle' },
        { label: 'Stethoscope', value: 'stethoscope' },
        { label: 'Book', value: 'book' },
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