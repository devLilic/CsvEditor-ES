import { describe, expect, it } from 'vitest'
import { settingsService } from '@/features/csv-editor/services/settingsService'
import {
    DEFAULT_ENABLE_PLATEAU_TITLE_DIVIDER_CREATION,
    createConfigWithPlateauTitleDividerCreationSetting,
    getPlateauTitleDividerCreationSetting,
} from './plateauTitleDividerCreationSetting'

describe('plateau title divider creation setting', () => {
    it('defaults to true', () => {
        expect(DEFAULT_ENABLE_PLATEAU_TITLE_DIVIDER_CREATION).toBe(true)
        expect(getPlateauTitleDividerCreationSetting({})).toBe(true)
    })

    it('saves false', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ theme: 'dark' })
        api.setAppConfig.mockImplementationOnce(async (config: Record<string, unknown>) => config)

        const result = await settingsService.setPlateauTitleDividerCreationEnabled(false)

        expect(result).toBe(false)
        expect(api.setAppConfig).toHaveBeenCalledWith({
            theme: 'dark',
            enablePlateauTitleDividerCreation: false,
        })
    })

    it('restores the saved value', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ enablePlateauTitleDividerCreation: false })

        await expect(settingsService.getPlateauTitleDividerCreationEnabled()).resolves.toBe(false)
    })

    it('uses fallback for invalid values', () => {
        expect(getPlateauTitleDividerCreationSetting({ enablePlateauTitleDividerCreation: 'false' })).toBe(true)
        expect(getPlateauTitleDividerCreationSetting({ enablePlateauTitleDividerCreation: 0 })).toBe(true)
        expect(createConfigWithPlateauTitleDividerCreationSetting(null, false)).toEqual({
            enablePlateauTitleDividerCreation: false,
        })
    })
})
