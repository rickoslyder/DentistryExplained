/**
 * Geographic Blocking
 * 
 * Block or allow traffic based on geographic location
 */

import { GeoInfo, SecuritySettings } from '../types'
import { SecurityContextManager } from '../context'
import { cacheManager } from '@/lib/cache'
import { getSettings } from '@/lib/settings'

export class GeoBlockingService {
  private static readonly CACHE_PREFIX = 'geo:'
  private static readonly CACHE_TTL = 3600 // 1 hour

  /**
   * Check if request should be blocked based on geography
   */
  static async shouldBlock(geoInfo: GeoInfo | undefined): Promise<boolean> {
    if (!geoInfo?.country) {
      // No geo info available, allow by default
      return false
    }

    // Get settings
    const settings = await getSettings()
    const geoConfig = settings.security?.ddosProtection?.geoBlocking

    if (!geoConfig?.enabled) {
      return false
    }

    const country = geoInfo.country.toUpperCase()

    // Check allowed countries (whitelist)
    if (geoConfig.allowedCountries && geoConfig.allowedCountries.length > 0) {
      const allowed = geoConfig.allowedCountries.map(c => c.toUpperCase())
      return !allowed.includes(country)
    }

    // Check blocked countries (blacklist)
    if (geoConfig.blockedCountries && geoConfig.blockedCountries.length > 0) {
      const blocked = geoConfig.blockedCountries.map(c => c.toUpperCase())
      return blocked.includes(country)
    }

    // No rules configured, allow by default
    return false
  }

  /**
   * Get geo info from IP address
   */
  static async getGeoInfo(ip: string): Promise<GeoInfo | undefined> {
    // Check cache first
    const cached = await this.getCachedGeoInfo(ip)
    if (cached) {
      return cached
    }

    // Try to get from Cloudflare headers first (already handled in context)
    const context = SecurityContextManager.get()
    if (context?.geoInfo) {
      await this.cacheGeoInfo(ip, context.geoInfo)
      return context.geoInfo
    }

    // Fallback to IP geolocation service
    try {
      const geoInfo = await this.fetchGeoInfo(ip)
      if (geoInfo) {
        await this.cacheGeoInfo(ip, geoInfo)
      }
      return geoInfo
    } catch (error) {
      console.error('Failed to fetch geo info:', error)
      return undefined
    }
  }

  /**
   * Fetch geo info from external service
   */
  private static async fetchGeoInfo(ip: string): Promise<GeoInfo | undefined> {
    // Skip for local IPs
    if (this.isLocalIP(ip)) {
      return {
        country: 'LOCAL',
        city: 'Local Network'
      }
    }

    // Use ipapi.co free tier (no API key required for basic info)
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: {
          'User-Agent': 'dentistry-explained/1.0'
        }
      })

      if (!response.ok) {
        return undefined
      }

      const data = await response.json()

      return {
        country: data.country_code,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone
      }
    } catch (error) {
      console.error('IP geolocation failed:', error)
      return undefined
    }
  }

  /**
   * Cache geo info
   */
  private static async cacheGeoInfo(ip: string, geoInfo: GeoInfo): Promise<void> {
    const key = `${this.CACHE_PREFIX}${ip}`
    await cacheManager.set(key, geoInfo, { 
      ttl: this.CACHE_TTL,
      tags: ['geo', `country:${geoInfo.country}`]
    })
  }

  /**
   * Get cached geo info
   */
  private static async getCachedGeoInfo(ip: string): Promise<GeoInfo | undefined> {
    const key = `${this.CACHE_PREFIX}${ip}`
    return await cacheManager.get<GeoInfo>(key)
  }

  /**
   * Check if IP is local/private
   */
  private static isLocalIP(ip: string): boolean {
    const parts = ip.split('.')
    if (parts.length !== 4) return false

    const first = parseInt(parts[0])
    const second = parseInt(parts[1])

    // Check for private IP ranges
    return (
      ip === '127.0.0.1' ||
      ip === 'localhost' ||
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    )
  }

  /**
   * Get country statistics
   */
  static async getCountryStats(): Promise<Record<string, number>> {
    // This would typically query from a database or analytics service
    // For now, return empty stats
    return {}
  }

  /**
   * Block an entire country
   */
  static async blockCountry(countryCode: string): Promise<void> {
    const settings = await getSettings()
    const geoConfig = settings.security?.ddosProtection?.geoBlocking

    if (!geoConfig) {
      throw new Error('Geo-blocking not configured')
    }

    const blocked = geoConfig.blockedCountries || []
    if (!blocked.includes(countryCode)) {
      blocked.push(countryCode)
      
      // Update settings (would need to implement settings update)
      console.log(`Would block country: ${countryCode}`)
    }
  }

  /**
   * Unblock a country
   */
  static async unblockCountry(countryCode: string): Promise<void> {
    const settings = await getSettings()
    const geoConfig = settings.security?.ddosProtection?.geoBlocking

    if (!geoConfig) {
      throw new Error('Geo-blocking not configured')
    }

    const blocked = geoConfig.blockedCountries || []
    const index = blocked.indexOf(countryCode)
    if (index > -1) {
      blocked.splice(index, 1)
      
      // Update settings (would need to implement settings update)
      console.log(`Would unblock country: ${countryCode}`)
    }
  }

  /**
   * Get blocked countries list
   */
  static async getBlockedCountries(): Promise<string[]> {
    const settings = await getSettings()
    return settings.security?.ddosProtection?.geoBlocking?.blockedCountries || []
  }

  /**
   * Get allowed countries list
   */
  static async getAllowedCountries(): Promise<string[]> {
    const settings = await getSettings()
    return settings.security?.ddosProtection?.geoBlocking?.allowedCountries || []
  }
}

// Country code to name mapping (partial list)
export const countryNames: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'IE': 'Ireland',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'RU': 'Russia',
  'CN': 'China',
  'JP': 'Japan',
  'KR': 'South Korea',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'LOCAL': 'Local Network'
}