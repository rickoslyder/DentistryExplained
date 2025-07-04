import { RichTextField } from 'payload/types'
import { 
  HTMLConverterFeature, 
  lexicalEditor,
  BlocksFeature,
  UploadFeature,
  LinkFeature,
  HeadingFeature,
  OrderedListFeature,
  UnorderedListFeature,
  BlockquoteFeature,
  ChecklistFeature,
} from '@payloadcms/richtext-lexical'

// Custom block for medical warnings/cautions
export const WarningBlock = {
  slug: 'warning',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'warning',
      options: [
        { label: 'Warning', value: 'warning' },
        { label: 'Caution', value: 'caution' },
        { label: 'Important', value: 'important' },
        { label: 'Note', value: 'note' },
      ],
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
  ],
}

// Custom block for procedure steps
export const ProcedureStepBlock = {
  slug: 'procedure-step',
  fields: [
    {
      name: 'stepNumber',
      type: 'number',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'duration',
      type: 'text',
      admin: {
        description: 'e.g., "5-10 minutes"',
      },
    },
  ],
}

// Custom block for dosage information
export const DosageBlock = {
  slug: 'dosage',
  fields: [
    {
      name: 'medication',
      type: 'text',
      required: true,
    },
    {
      name: 'dosage',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g., "500mg"',
      },
    },
    {
      name: 'frequency',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g., "3 times daily"',
      },
    },
    {
      name: 'duration',
      type: 'text',
      admin: {
        description: 'e.g., "7 days"',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Special instructions or contraindications',
      },
    },
  ],
}

// Custom block for risk/benefit analysis
export const RiskBenefitBlock = {
  slug: 'risk-benefit',
  fields: [
    {
      name: 'risks',
      type: 'array',
      fields: [
        {
          name: 'risk',
          type: 'text',
          required: true,
        },
        {
          name: 'likelihood',
          type: 'select',
          options: [
            { label: 'Common (>10%)', value: 'common' },
            { label: 'Uncommon (1-10%)', value: 'uncommon' },
            { label: 'Rare (<1%)', value: 'rare' },
          ],
        },
      ],
    },
    {
      name: 'benefits',
      type: 'array',
      fields: [
        {
          name: 'benefit',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}

export const createRichTextField = (
  name: string,
  label?: string,
  required = false
): RichTextField => ({
  name,
  label,
  type: 'richText',
  required,
  editor: lexicalEditor({
    features: [
      // Standard features
      HeadingFeature({ enabledHeadingLevels: ['h2', 'h3', 'h4'] }),
      OrderedListFeature(),
      UnorderedListFeature(),
      ChecklistFeature(),
      BlockquoteFeature(),
      LinkFeature({
        fields: [
          {
            name: 'rel',
            type: 'select',
            hasMany: true,
            options: ['nofollow', 'noopener', 'noreferrer'],
          },
        ],
      }),
      UploadFeature({
        collections: {
          media: {
            fields: [
              {
                name: 'caption',
                type: 'text',
              },
              {
                name: 'alignment',
                type: 'select',
                options: [
                  { label: 'Left', value: 'left' },
                  { label: 'Center', value: 'center' },
                  { label: 'Right', value: 'right' },
                ],
              },
            ],
          },
        },
      }),
      // Medical-specific blocks
      BlocksFeature({
        blocks: [
          WarningBlock,
          ProcedureStepBlock,
          DosageBlock,
          RiskBenefitBlock,
        ],
      }),
      HTMLConverterFeature(),
    ],
  }),
})