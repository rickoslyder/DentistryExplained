import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const samplePractices = [
  {
    name: 'Smile Dental Practice',
    slug: 'smile-dental-practice',
    description: 'A modern dental practice offering comprehensive dental care with the latest technology.',
    latitude: 51.5074,
    longitude: -0.1278,
    address: {
      line1: '123 High Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'UK'
    },
    contact: {
      phone: '020 7123 4567',
      email: 'info@smiledental.co.uk'
    },
    services: ['General Dentistry', 'Cosmetic Dentistry', 'Orthodontics', 'Teeth Whitening', 'Dental Implants'],
    nhs_accepted: true,
    private_accepted: true,
    accessibility_features: ['wheelchair_access', 'disabled_parking', 'accessible_toilet'],
    opening_hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { closed: true }
    },
    website_url: 'https://www.smiledental.co.uk'
  },
  {
    name: 'Central London Dental Clinic',
    slug: 'central-london-dental-clinic',
    description: 'Premium dental care in the heart of London, specializing in cosmetic and restorative dentistry.',
    latitude: 51.5155,
    longitude: -0.1419,
    address: {
      line1: '456 Oxford Street',
      city: 'London',
      postcode: 'W1C 1DE',
      country: 'UK'
    },
    contact: {
      phone: '020 7987 6543',
      email: 'hello@centrallondondental.com'
    },
    services: ['General Dentistry', 'Implants', 'Emergency Care', 'Veneers', 'Invisalign'],
    nhs_accepted: false,
    private_accepted: true,
    accessibility_features: ['wheelchair_access', 'lift_access'],
    opening_hours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '10:00', close: '16:00' }
    },
    website_url: 'https://www.centrallondondental.com'
  },
  {
    name: 'Family Dental Care',
    slug: 'family-dental-care',
    description: 'Friendly, affordable dental care for the whole family with a focus on preventive dentistry.',
    latitude: 51.5238,
    longitude: -0.1585,
    address: {
      line1: '789 Baker Street',
      city: 'London',
      postcode: 'NW1 6XE',
      country: 'UK'
    },
    contact: {
      phone: '020 7456 7890',
      email: 'contact@familydentalcare.uk'
    },
    services: ['General Dentistry', 'Pediatric Dentistry', 'Preventive Care', 'Hygiene Services'],
    nhs_accepted: true,
    private_accepted: false,
    accessibility_features: ['wheelchair_access', 'ground_floor_surgery'],
    opening_hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { closed: true },
      sunday: { closed: true }
    },
    website_url: null
  },
  {
    name: 'Kensington Dental Studio',
    slug: 'kensington-dental-studio',
    description: 'Luxury dental studio offering bespoke treatments in an elegant setting.',
    latitude: 51.4994,
    longitude: -0.1967,
    address: {
      line1: '22 Kensington High Street',
      city: 'London',
      postcode: 'W8 4PF',
      country: 'UK'
    },
    contact: {
      phone: '020 7937 1234',
      email: 'reception@kensingtondental.co.uk'
    },
    services: ['Cosmetic Dentistry', 'Smile Makeovers', 'Ceramic Crowns', 'Teeth Whitening', 'Facial Aesthetics'],
    nhs_accepted: false,
    private_accepted: true,
    accessibility_features: ['wheelchair_access', 'lift_access', 'disabled_parking'],
    opening_hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '15:00' },
      sunday: { closed: true }
    },
    website_url: 'https://www.kensingtondental.co.uk'
  },
  {
    name: 'East London Dental Centre',
    slug: 'east-london-dental-centre',
    description: 'Community-focused dental practice providing affordable care with NHS and private options.',
    latitude: 51.5273,
    longitude: -0.0557,
    address: {
      line1: '345 Mile End Road',
      city: 'London',
      postcode: 'E1 4NS',
      country: 'UK'
    },
    contact: {
      phone: '020 8123 4567',
      email: 'info@eastlondondental.com'
    },
    services: ['General Dentistry', 'Emergency Care', 'Root Canal Treatment', 'Extractions', 'Dentures'],
    nhs_accepted: true,
    private_accepted: true,
    accessibility_features: ['wheelchair_access', 'ground_floor_surgery', 'hearing_loop'],
    opening_hours: {
      monday: { open: '08:30', close: '19:00' },
      tuesday: { open: '08:30', close: '19:00' },
      wednesday: { open: '08:30', close: '19:00' },
      thursday: { open: '08:30', close: '19:00' },
      friday: { open: '08:30', close: '17:00' },
      saturday: { open: '09:00', close: '14:00' },
      sunday: { closed: true }
    },
    website_url: 'https://www.eastlondondental.com'
  }
]

async function seedPractices() {
  console.log('Starting to seed practice listings...')
  
  try {
    // Clear existing data
    const { error: deleteError } = await supabase
      .from('practice_listings')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.error('Error clearing existing practices:', deleteError)
      return
    }
    
    // Insert new practices
    for (const practice of samplePractices) {
      const { error } = await supabase
        .from('practice_listings')
        .insert(practice)
      
      if (error) {
        console.error(`Error inserting ${practice.name}:`, error)
      } else {
        console.log(`✓ Inserted ${practice.name}`)
      }
    }
    
    console.log('\nSeeding complete!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

seedPractices()