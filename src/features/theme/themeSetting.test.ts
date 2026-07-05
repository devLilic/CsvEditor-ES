import { describe, expect, it } from 'vitest'
import { settingsService } from '@/features/csv-editor/services/settingsService'
import {
    createConfigWithUiThemeSetting,
    getUiThemeSetting,
    persistUiThemeSetting,
    restoreUiThemeSetting,
} from './themeSetting'

describe('themeSetting', () => {
    it('persista legacy', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ keepData: true })
        api.setAppConfig.mockImplementationOnce(async (config: Record<string, unknown>) => config)

        const result = await settingsService.setUiTheme('legacy')

        expect(result).toBe('legacy')
        expect(api.setAppConfig).toHaveBeenCalledWith({
            keepData: true,
            uiTheme: 'legacy',
        })
    })

    it('persista metallic', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ keepData: true })
        api.setAppConfig.mockImplementationOnce(async (config: Record<string, unknown>) => config)

        const result = await settingsService.setUiTheme('metallic')

        expect(result).toBe('metallic')
        expect(api.setAppConfig).toHaveBeenCalledWith({
            keepData: true,
            uiTheme: 'metallic',
        })
    })

    it('persista dark', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ keepData: true })
        api.setAppConfig.mockImplementationOnce(async (config: Record<string, unknown>) => config)

        const result = await settingsService.setUiTheme('dark')

        expect(result).toBe('dark')
        expect(api.setAppConfig).toHaveBeenCalledWith({
            keepData: true,
            uiTheme: 'dark',
        })
    })

    it('restaureaza tema', async () => {
        const element = document.createElement('div')

        const result = await restoreUiThemeSetting(
            async () => ({ uiTheme: 'metallic' }),
            element
        )

        expect(result).toBe('metallic')
        expect(element).toHaveAttribute('data-theme', 'metallic')
    })

    it('aplica schimbarea imediat', async () => {
        const element = document.createElement('div')

        const result = await persistUiThemeSetting(
            async () => ({}),
            async (config) => config,
            'metallic',
            element
        )

        expect(result).toBe('metallic')
        expect(element).toHaveAttribute('data-theme', 'metallic')
    })

    it('fallback la legacy', () => {
        expect(getUiThemeSetting({ uiTheme: 'unknown' })).toBe('legacy')
        expect(createConfigWithUiThemeSetting(null, 'legacy')).toEqual({
            uiTheme: 'legacy',
        })
    })
})
