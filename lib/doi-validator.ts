import { z } from 'zod'

// DOI validation regex
const DOI_REGEX = /^10\.\d{4,}(?:\.\d+)*\/[-._;()\/:a-zA-Z0-9]+$/

// Citation formats
export const citationFormats = ['apa', 'mla', 'chicago', 'vancouver', 'harvard'] as const
export type CitationFormat = typeof citationFormats[number]

// Medical reference schema
export const MedicalReferenceSchema = z.object({
  id: z.string(),
  doi: z.string().regex(DOI_REGEX, 'Invalid DOI format'),
  title: z.string(),
  authors: z.array(z.string()),
  journal: z.string(),
  year: z.number(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  pmid: z.string().optional(),
  abstract: z.string().optional(),
  url: z.string().url().optional(),
  addedAt: z.date(),
  lastAccessed: z.date(),
  tags: z.array(z.string()).optional()
})

export type MedicalReference = z.infer<typeof MedicalReferenceSchema>

// DOI validation function
export function validateDOI(doi: string): boolean {
  return DOI_REGEX.test(doi)
}

// Format DOI URL
export function formatDOIUrl(doi: string): string {
  return `https://doi.org/${doi}`
}

// Fetch DOI metadata from CrossRef API
export async function fetchDOIMetadata(doi: string): Promise<MedicalReference | null> {
  if (!validateDOI(doi)) {
    throw new Error('Invalid DOI format')
  }

  try {
    const response = await fetch(`https://api.crossref.org/works/${doi}`, {
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error('DOI not found')
    }

    const data = await response.json()
    const work = data.message

    // Extract authors
    const authors = work.author?.map((author: any) => {
      const parts = []
      if (author.given) parts.push(author.given)
      if (author.family) parts.push(author.family)
      return parts.join(' ')
    }) || []

    // Extract publication date
    const dateParts = work.published?.['date-parts']?.[0]
    const year = dateParts?.[0] || new Date().getFullYear()

    // Extract pages
    let pages: string | undefined
    if (work.page) {
      pages = work.page
    } else if (work['article-number']) {
      pages = work['article-number']
    }

    const reference: MedicalReference = {
      id: doi.replace(/[^\w-]/g, '_'),
      doi,
      title: work.title?.[0] || 'Untitled',
      authors,
      journal: work['container-title']?.[0] || work.publisher || 'Unknown Journal',
      year,
      volume: work.volume,
      issue: work.issue,
      pages,
      url: work.URL || formatDOIUrl(doi),
      abstract: work.abstract,
      addedAt: new Date(),
      lastAccessed: new Date()
    }

    return reference
  } catch (error) {
    console.error('Error fetching DOI metadata:', error)
    return null
  }
}

// Format citation based on format type
export function formatCitation(ref: MedicalReference, format: CitationFormat = 'apa'): string {
  const authorsStr = ref.authors.join(', ')
  const year = ref.year
  const title = ref.title
  const journal = ref.journal
  const volume = ref.volume
  const issue = ref.issue
  const pages = ref.pages
  const doi = ref.doi

  switch (format) {
    case 'apa':
      // APA 7th Edition
      let apa = `${authorsStr} (${year}). ${title}. *${journal}*`
      if (volume) {
        apa += `, *${volume}*`
        if (issue) apa += `(${issue})`
      }
      if (pages) apa += `, ${pages}`
      apa += `. https://doi.org/${doi}`
      return apa

    case 'mla':
      // MLA 9th Edition
      let mla = `${authorsStr}. "${title}." *${journal}*`
      if (volume) {
        mla += `, vol. ${volume}`
        if (issue) mla += `, no. ${issue}`
      }
      mla += `, ${year}`
      if (pages) mla += `, pp. ${pages}`
      mla += `. doi:${doi}`
      return mla

    case 'chicago':
      // Chicago 17th Edition (Notes-Bibliography)
      let chicago = `${authorsStr}. "${title}." *${journal}*`
      if (volume) {
        chicago += ` ${volume}`
        if (issue) chicago += `, no. ${issue}`
      }
      chicago += ` (${year})`
      if (pages) chicago += `: ${pages}`
      chicago += `. https://doi.org/${doi}`
      return chicago

    case 'vancouver':
      // Vancouver style (common in medical journals)
      let vancouver = `${authorsStr}. ${title}. ${journal}. ${year}`
      if (volume) {
        vancouver += `;${volume}`
        if (issue) vancouver += `(${issue})`
      }
      if (pages) vancouver += `:${pages}`
      vancouver += `. doi: ${doi}`
      return vancouver

    case 'harvard':
      // Harvard style
      let harvard = `${authorsStr} ${year}, '${title}', *${journal}*`
      if (volume) {
        harvard += `, vol. ${volume}`
        if (issue) harvard += `, no. ${issue}`
      }
      if (pages) harvard += `, pp. ${pages}`
      harvard += `, doi: ${doi}`
      return harvard

    default:
      return `${authorsStr} (${year}). ${title}. ${journal}. DOI: ${doi}`
  }
}

// Generate BibTeX entry
export function generateBibTeX(ref: MedicalReference): string {
  const entryType = '@article'
  const citeKey = `${ref.authors[0]?.split(' ').pop() || 'Unknown'}${ref.year}`
  
  let bibtex = `${entryType}{${citeKey},\n`
  bibtex += `  title = {${ref.title}},\n`
  bibtex += `  author = {${ref.authors.join(' and ')}},\n`
  bibtex += `  journal = {${ref.journal}},\n`
  bibtex += `  year = {${ref.year}},\n`
  if (ref.volume) bibtex += `  volume = {${ref.volume}},\n`
  if (ref.issue) bibtex += `  number = {${ref.issue}},\n`
  if (ref.pages) bibtex += `  pages = {${ref.pages}},\n`
  bibtex += `  doi = {${ref.doi}},\n`
  bibtex += `  url = {https://doi.org/${ref.doi}}\n`
  bibtex += '}'
  
  return bibtex
}

// Search PubMed by PMID
export async function fetchPubMedMetadata(pmid: string): Promise<MedicalReference | null> {
  try {
    // First, get the summary
    const summaryResponse = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`
    )
    
    if (!summaryResponse.ok) {
      throw new Error('PMID not found')
    }
    
    const summaryData = await summaryResponse.json()
    const article = summaryData.result?.[pmid]
    
    if (!article) {
      throw new Error('Article not found')
    }
    
    // Extract authors
    const authors = article.authors?.map((author: any) => author.name) || []
    
    // Extract publication date
    const pubDate = article.pubdate || article.epubdate
    const year = parseInt(pubDate?.split(' ')?.[0]) || new Date().getFullYear()
    
    // Try to get DOI
    const doi = article.elocationid?.replace('doi: ', '') || ''
    
    const reference: MedicalReference = {
      id: `pmid_${pmid}`,
      doi: doi || `pmid:${pmid}`,
      title: article.title || 'Untitled',
      authors,
      journal: article.source || 'Unknown Journal',
      year,
      volume: article.volume,
      issue: article.issue,
      pages: article.pages,
      pmid,
      addedAt: new Date(),
      lastAccessed: new Date()
    }
    
    return reference
  } catch (error) {
    console.error('Error fetching PubMed metadata:', error)
    return null
  }
}