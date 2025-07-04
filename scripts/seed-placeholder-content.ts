import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Placeholder articles data
const placeholderArticles = [
  // General Oral Health
  {
    title: '[PLACEHOLDER] Daily Oral Hygiene Routine',
    slug: 'daily-oral-hygiene',
    category_slug: 'general-oral-health',
    content: `---
title: "[PLACEHOLDER] Daily Oral Hygiene Routine"
excerpt: "Learn the essential steps for maintaining optimal oral health through proper daily hygiene practices."
category: "General Oral Health"
tags: ["oral hygiene", "brushing", "flossing", "prevention"]
---

<!-- PLACEHOLDER CONTENT - Replace with medically reviewed content -->

# Daily Oral Hygiene Routine

Maintaining good oral hygiene is essential for preventing dental problems and ensuring overall health.

## The Basics of Oral Hygiene

<Alert type="info">
  This is placeholder content. Please replace with medically reviewed information before publishing.
</Alert>

### Brushing Your Teeth

**Recommended frequency**: Brush twice daily for at least 2 minutes each time.

<ProcedureSteps>
  <li>Use a soft-bristled toothbrush</li>
  <li>Apply fluoride toothpaste (pea-sized amount)</li>
  <li>Brush at a 45-degree angle to your gums</li>
  <li>Use gentle circular motions</li>
  <li>Don't forget to brush your tongue</li>
</ProcedureSteps>

### Flossing

Daily flossing removes plaque and food particles from between teeth where your toothbrush can't reach.

### Mouthwash

Using an antimicrobial mouthwash can help reduce bacteria and freshen breath.

## Creating Your Routine

<Timeline>
  <TimelineItem date="Morning" title="Start Your Day">
    Brush teeth after breakfast, focusing on removing overnight bacteria buildup
  </TimelineItem>
  <TimelineItem date="After Meals" title="Rinse">
    Rinse with water after eating to remove food particles
  </TimelineItem>
  <TimelineItem date="Evening" title="Complete Care">
    Floss first, then brush thoroughly before bed
  </TimelineItem>
</Timeline>

## Common Mistakes to Avoid

- Brushing too hard
- Using a hard-bristled brush
- Replacing toothbrush too infrequently
- Rushing through your routine

<Alert type="warning">
  Replace your toothbrush every 3-4 months or sooner if bristles become frayed.
</Alert>`,
    excerpt: 'Learn the essential steps for maintaining optimal oral health through proper daily hygiene practices.',
    tags: ['oral hygiene', 'brushing', 'flossing', 'prevention'],
    status: 'published',
    meta_title: '[PLACEHOLDER] Daily Oral Hygiene Guide | Dentistry Explained',
    meta_description: 'Placeholder content for daily oral hygiene routine. To be replaced with medically reviewed content.',
  },
  
  // Dental Problems
  {
    title: '[PLACEHOLDER] Understanding Tooth Decay',
    slug: 'tooth-decay',
    category_slug: 'dental-problems',
    content: `---
title: "[PLACEHOLDER] Understanding Tooth Decay"
excerpt: "Learn about the causes, symptoms, and treatment options for tooth decay."
category: "Dental Problems"
tags: ["tooth decay", "cavities", "dental caries", "prevention"]
---

<!-- PLACEHOLDER CONTENT - Replace with medically reviewed content -->

# Understanding Tooth Decay

Tooth decay, also known as dental caries or cavities, is one of the most common dental problems.

## What Causes Tooth Decay?

<Alert type="info">
  This is placeholder content awaiting medical review.
</Alert>

### The Process of Decay

1. **Bacteria** in your mouth feed on sugars and starches
2. **Acid** is produced as a byproduct
3. **Enamel** begins to break down
4. **Cavities** form if left untreated

## Symptoms to Watch For

<FAQ question="How do I know if I have tooth decay?">
  Common signs include:
  - Tooth sensitivity
  - Visible holes or pits
  - Pain when eating sweet, hot, or cold foods
  - Brown, black, or white stains
</FAQ>

## Treatment Options

<CostTable costs={[
  { item: "Dental Filling", cost: "£50-150", nhs: true },
  { item: "Root Canal", cost: "£200-600", nhs: true },
  { item: "Dental Crown", cost: "£300-800", nhs: true }
]} />

## Prevention Strategies

- Brush twice daily with fluoride toothpaste
- Floss daily
- Limit sugary foods and drinks
- Regular dental check-ups

<Alert type="warning">
  Early detection is key to preventing serious complications.
</Alert>`,
    excerpt: 'Learn about the causes, symptoms, and treatment options for tooth decay.',
    tags: ['tooth decay', 'cavities', 'dental caries', 'prevention'],
    status: 'published',
    meta_title: '[PLACEHOLDER] Tooth Decay Guide | Dentistry Explained',
    meta_description: 'Placeholder content about tooth decay. To be replaced with medically reviewed information.',
  },
  
  // Treatments
  {
    title: '[PLACEHOLDER] Dental Fillings Explained',
    slug: 'fillings',
    category_slug: 'treatments',
    content: `---
title: "[PLACEHOLDER] Dental Fillings Explained"
excerpt: "Everything you need to know about dental fillings, from types to procedures."
category: "Treatments"
tags: ["fillings", "restorative dentistry", "cavity treatment"]
---

<!-- PLACEHOLDER CONTENT - Replace with medically reviewed content -->

# Dental Fillings Explained

Dental fillings are one of the most common dental procedures used to restore teeth damaged by decay.

## Types of Fillings

<Alert type="info">
  This placeholder content requires medical review before publication.
</Alert>

### Amalgam Fillings
- Made from a mixture of metals
- Durable and long-lasting
- Silver in appearance

### Composite Fillings
- Tooth-colored material
- Bonds directly to tooth
- More aesthetic option

### Gold Fillings
- Very durable
- More expensive option
- Requires multiple visits

## The Filling Procedure

<Timeline>
  <TimelineItem date="Step 1" title="Numbing">
    Local anesthetic is applied to numb the area
  </TimelineItem>
  <TimelineItem date="Step 2" title="Decay Removal">
    Dentist removes decayed tooth material
  </TimelineItem>
  <TimelineItem date="Step 3" title="Preparation">
    Tooth is cleaned and prepared
  </TimelineItem>
  <TimelineItem date="Step 4" title="Filling Placement">
    Filling material is placed and shaped
  </TimelineItem>
  <TimelineItem date="Step 5" title="Polishing">
    Filling is polished for smooth finish
  </TimelineItem>
</Timeline>

## Aftercare

- Avoid hard foods for 24 hours
- Some sensitivity is normal
- Maintain good oral hygiene

<CostTable costs={[
  { item: "White Filling (1 surface)", cost: "£60-120", nhs: true },
  { item: "White Filling (2+ surfaces)", cost: "£80-170", nhs: true },
  { item: "Gold Filling", cost: "£250-450", nhs: false }
]} />`,
    excerpt: 'Everything you need to know about dental fillings, from types to procedures.',
    tags: ['fillings', 'restorative dentistry', 'cavity treatment'],
    status: 'published',
    meta_title: '[PLACEHOLDER] Dental Fillings Guide | Dentistry Explained',
    meta_description: 'Placeholder guide to dental fillings. Awaiting medical review.',
  },
  
  // Emergency Care
  {
    title: '[PLACEHOLDER] Dental Emergency Guide',
    slug: 'dental-trauma',
    category_slug: 'emergency-care',
    content: `---
title: "[PLACEHOLDER] Dental Emergency Guide"
excerpt: "What to do in dental emergencies and when to seek immediate care."
category: "Emergency Care"
tags: ["emergency", "dental trauma", "first aid"]
---

<!-- PLACEHOLDER CONTENT - Replace with medically reviewed content -->

# Dental Emergency Guide

Knowing what to do in a dental emergency can make the difference between saving and losing a tooth.

<Alert type="error">
  This is placeholder content. In a real emergency, call 111 or visit A&E.
</Alert>

## Common Dental Emergencies

### Knocked-Out Tooth

<ProcedureSteps>
  <li>Find the tooth and pick it up by the crown (not the root)</li>
  <li>Rinse gently with water if dirty</li>
  <li>Try to reinsert it into the socket</li>
  <li>If not possible, store in milk</li>
  <li>See a dentist within 30 minutes</li>
</ProcedureSteps>

### Severe Toothache

- Rinse with warm salt water
- Use dental floss to remove any trapped food
- Take over-the-counter pain relief
- Apply cold compress to outside of cheek

### Broken or Chipped Tooth

- Save any pieces
- Rinse mouth with warm water
- Apply gauze if bleeding
- Use cold compress for swelling

## When to Seek Emergency Care

<Alert type="warning">
  Seek immediate care for:
  - Severe pain not relieved by painkillers
  - Facial swelling
  - Difficulty swallowing
  - High fever with dental pain
</Alert>

## Emergency Contact Information

- **NHS 111**: For urgent advice
- **Local A&E**: For severe emergencies
- **Emergency Dentist**: Contact your regular dentist's emergency line`,
    excerpt: 'What to do in dental emergencies and when to seek immediate care.',
    tags: ['emergency', 'dental trauma', 'first aid'],
    status: 'published',
    meta_title: '[PLACEHOLDER] Dental Emergency Guide | Dentistry Explained',
    meta_description: 'Placeholder emergency dental care guide. Requires medical review.',
  },
]

async function seedPlaceholderContent() {
  console.log('Starting to seed placeholder content...')
  
  try {
    // First, get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, slug')
    
    if (catError) {
      console.error('Error fetching categories:', catError)
      return
    }
    
    // Create a map of category slugs to IDs
    const categoryMap = new Map(
      categories?.map(cat => [cat.slug, cat.id]) || []
    )
    
    // Get a default author (first admin/editor)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'professional')
      .in('role', ['admin', 'editor'])
      .limit(1)
    
    if (profileError || !profiles || profiles.length === 0) {
      console.error('No admin/editor profile found:', profileError)
      return
    }
    
    const authorId = profiles[0].id
    
    // Insert placeholder articles
    for (const article of placeholderArticles) {
      const categoryId = categoryMap.get(article.category_slug)
      
      if (!categoryId) {
        console.warn(`Category not found: ${article.category_slug}`)
        continue
      }
      
      const { category_slug, ...articleData } = article
      
      // Calculate read time
      const wordCount = articleData.content.split(/\s+/g).length
      const readTime = Math.ceil(wordCount / 225)
      
      // Check if article already exists
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', articleData.slug)
        .single()
      
      if (existing) {
        console.log(`Article already exists: ${articleData.slug}`)
        continue
      }
      
      // Insert article
      const { data: newArticle, error: insertError } = await supabase
        .from('articles')
        .insert({
          ...articleData,
          category_id: categoryId,
          author_id: authorId,
          read_time: readTime,
          published_at: new Date().toISOString(),
          views: 0,
          is_featured: false,
          allow_comments: true,
        })
        .select()
        .single()
      
      if (insertError) {
        console.error(`Error inserting article ${articleData.slug}:`, insertError)
        continue
      }
      
      console.log(`✓ Created placeholder article: ${articleData.title}`)
      
      // Create initial revision
      await supabase
        .from('article_revisions')
        .insert({
          article_id: newArticle.id,
          title: articleData.title,
          content: articleData.content,
          excerpt: articleData.excerpt,
          revision_number: 1,
          author_id: authorId,
          change_summary: 'Initial placeholder version',
        })
    }
    
    console.log('\n✅ Placeholder content seeding completed!')
    console.log('\n⚠️  Remember: All content is marked with [PLACEHOLDER] and needs medical review before launch.')
    
  } catch (error) {
    console.error('Error seeding content:', error)
  }
}

// Run the seeding
seedPlaceholderContent()