import { CollectionConfig } from 'payload/types'

export const References: CollectionConfig = {
  slug: 'references',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'authors', 'year', 'type'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'authors',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'publication',
      type: 'text',
      required: true,
      admin: {
        description: 'Journal, book, or publication name',
      },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Journal Article', value: 'journal' },
        { label: 'Book', value: 'book' },
        { label: 'Book Chapter', value: 'chapter' },
        { label: 'Clinical Guideline', value: 'guideline' },
        { label: 'Systematic Review', value: 'systematic-review' },
        { label: 'Meta-Analysis', value: 'meta-analysis' },
        { label: 'Government Report', value: 'gov-report' },
        { label: 'Website', value: 'website' },
      ],
    },
    {
      name: 'doi',
      type: 'text',
      label: 'DOI',
      admin: {
        description: 'Digital Object Identifier',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'URL',
      admin: {
        description: 'Link to the publication',
      },
    },
    {
      name: 'evidenceLevel',
      type: 'select',
      options: [
        { label: 'Level I - Systematic Reviews & Meta-analyses', value: '1' },
        { label: 'Level II - Randomized Controlled Trials', value: '2' },
        { label: 'Level III - Controlled Trials without Randomization', value: '3' },
        { label: 'Level IV - Case-Control or Cohort Studies', value: '4' },
        { label: 'Level V - Systematic Reviews of Qualitative Studies', value: '5' },
        { label: 'Level VI - Single Descriptive or Qualitative Study', value: '6' },
        { label: 'Level VII - Expert Opinion', value: '7' },
      ],
      admin: {
        description: 'Evidence hierarchy level',
      },
    },
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description: 'Brief summary of the reference',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this reference',
      },
    },
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'content-creator' || user?.role === 'medical-reviewer',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'content-creator' || user?.role === 'medical-reviewer',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}