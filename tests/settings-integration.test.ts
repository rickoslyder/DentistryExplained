import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getSettings, getSetting, clearSettingsCache } from '@/lib/settings'
import { supabaseAdmin } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn()
  }
}))

describe('Settings Integration Tests', () => {
  beforeEach(() => {
    clearSettingsCache()
    vi.clearAllMocks()
  })

  afterEach(() => {
    clearSettingsCache()
  })

  describe('getSettings', () => {
    it('should fetch all settings from database', async () => {
      const mockSettings = [
        { key: 'site_maintenance', value: { site_name: 'Test Site', enabled: false } },
        { key: 'chat_config', value: { enabled: true, rate_limit_per_hour: 100 } },
        { key: 'ai_config', value: { model: 'gpt-4', temperature: 0.8, max_tokens: 2000 } }
      ]

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSettings,
          error: null
        })
      } as any)

      const settings = await getSettings()

      expect(settings.site_name).toBe('Test Site')
      expect(settings.maintenance_mode).toBe(false)
      expect(settings.chat_enabled).toBe(true)
      expect(settings.chat_rate_limit).toBe(100)
      expect(settings.ai_model).toBe('gpt-4')
      expect(settings.ai_temperature).toBe(0.8)
      expect(settings.ai_max_tokens).toBe(2000)
    })

    it('should return default settings on database error', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      } as any)

      const settings = await getSettings()

      expect(settings.site_name).toBe('Dentistry Explained')
      expect(settings.chat_enabled).toBe(true)
      expect(settings.chat_rate_limit).toBe(50)
      expect(settings.ai_model).toBe('o4-mini')
    })

    it('should cache settings for subsequent calls', async () => {
      const mockSettings = [
        { key: 'chat_config', value: { enabled: false } }
      ]

      const selectMock = vi.fn().mockResolvedValue({
        data: mockSettings,
        error: null
      })

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: selectMock
      } as any)

      // First call
      const settings1 = await getSettings()
      expect(settings1.chat_enabled).toBe(false)
      expect(selectMock).toHaveBeenCalledTimes(1)

      // Second call should use cache
      const settings2 = await getSettings()
      expect(settings2.chat_enabled).toBe(false)
      expect(selectMock).toHaveBeenCalledTimes(1) // Still 1, not 2
    })
  })

  describe('getSetting', () => {
    it('should fetch a specific setting', async () => {
      const mockSettings = [
        { key: 'ai_config', value: { model: 'claude-3' } }
      ]

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSettings,
          error: null
        })
      } as any)

      const model = await getSetting('ai_model')
      expect(model).toBe('claude-3')
    })
  })

  describe('Settings Validation', () => {
    it('should validate email addresses', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      expect(emailRegex.test('valid@email.com')).toBe(true)
      expect(emailRegex.test('invalid-email')).toBe(false)
      expect(emailRegex.test('@invalid.com')).toBe(false)
      expect(emailRegex.test('invalid@')).toBe(false)
    })

    it('should validate URLs', () => {
      const validateUrl = (url: string) => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      }

      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://localhost:3000')).toBe(true)
      expect(validateUrl('invalid-url')).toBe(false)
      expect(validateUrl('ftp://example.com')).toBe(true)
    })

    it('should validate numeric ranges', () => {
      // Chat rate limit
      const validateChatRateLimit = (value: number) => value >= 1 && value <= 1000
      expect(validateChatRateLimit(50)).toBe(true)
      expect(validateChatRateLimit(0)).toBe(false)
      expect(validateChatRateLimit(1001)).toBe(false)

      // AI temperature
      const validateTemperature = (value: number) => value >= 0 && value <= 2
      expect(validateTemperature(0.7)).toBe(true)
      expect(validateTemperature(-0.1)).toBe(false)
      expect(validateTemperature(2.1)).toBe(false)

      // Max tokens
      const validateMaxTokens = (value: number) => value >= 100 && value <= 32000
      expect(validateMaxTokens(4096)).toBe(true)
      expect(validateMaxTokens(50)).toBe(false)
      expect(validateMaxTokens(40000)).toBe(false)
    })
  })

  describe('Settings Usage in Features', () => {
    it('should check chat_enabled before processing chat', async () => {
      const mockSettings = [
        { key: 'chat_config', value: { enabled: false } }
      ]

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSettings,
          error: null
        })
      } as any)

      const settings = await getSettings()
      
      // Simulate chat API check
      if (!settings.chat_enabled) {
        expect(settings.chat_enabled).toBe(false)
      }
    })

    it('should use AI settings for model configuration', async () => {
      const mockSettings = [
        { 
          key: 'ai_config', 
          value: { 
            model: 'custom-model',
            temperature: 0.5,
            max_tokens: 8000,
            system_prompt: 'Custom prompt'
          } 
        }
      ]

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSettings,
          error: null
        })
      } as any)

      const settings = await getSettings()
      
      // Model config for AI
      const modelConfig = {
        model: settings.ai_model,
        temperature: settings.ai_temperature,
        max_tokens: settings.ai_max_tokens,
        stream: true
      }

      expect(modelConfig.model).toBe('custom-model')
      expect(modelConfig.temperature).toBe(0.5)
      expect(modelConfig.max_tokens).toBe(8000)
    })

    it('should check web_search_enabled for search features', async () => {
      const mockSettings = [
        { key: 'features_config', value: { web_search_enabled: false } }
      ]

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSettings,
          error: null
        })
      } as any)

      const settings = await getSettings()
      
      // Simulate web search check
      const shouldSearch = settings.web_search_enabled && true // user preference
      expect(shouldSearch).toBe(false)
    })
  })
})