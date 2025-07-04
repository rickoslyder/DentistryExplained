import { CollectionConfig } from 'payload/types'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'content-creator',
      options: [
        {
          label: 'Administrator',
          value: 'admin',
        },
        {
          label: 'Content Creator',
          value: 'content-creator',
        },
        {
          label: 'Medical Reviewer',
          value: 'medical-reviewer',
        },
      ],
    },
    {
      name: 'gdcNumber',
      type: 'text',
      label: 'GDC Number',
      admin: {
        description: 'General Dental Council registration number',
      },
    },
    {
      name: 'specialties',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'General Dentistry', value: 'general' },
        { label: 'Endodontics', value: 'endodontics' },
        { label: 'Periodontics', value: 'periodontics' },
        { label: 'Prosthodontics', value: 'prosthodontics' },
        { label: 'Oral Surgery', value: 'oral-surgery' },
        { label: 'Orthodontics', value: 'orthodontics' },
        { label: 'Pediatric Dentistry', value: 'pediatric' },
        { label: 'Oral Medicine', value: 'oral-medicine' },
      ],
    },
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}