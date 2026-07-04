import { describe, expect, it } from 'vitest'
import {
    DEFAULT_ENABLE_PLATEAU_TITLE_DRAG_DROP,
    createConfigWithPlateauTitleDragDropSetting,
    getPlateauTitleDragDropSetting,
} from './plateauTitleDragDropSetting'
import { settingsService } from '@/features/csv-editor/services/settingsService'

describe('plateau title drag-and-drop setting', () => {
    it('defaults to true', () => {
        expect(DEFAULT_ENABLE_PLATEAU_TITLE_DRAG_DROP).toBe(true)
        expect(getPlateauTitleDragDropSetting({})).toBe(true)
    })

    it('saves true', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ theme: 'metallic' })
        api.setAppConfig.mockImplementationOnce(async (config: Record<string, unknown>) => config)

        const result = await settingsService.setPlateauTitleDragDropEnabled(true)

        expect(result).toBe(true)
        expect(api.setAppConfig).toHaveBeenCalledWith({
            theme: 'metallic',
            enablePlateauTitleDragDrop: true,
        })
    })

    it('saves false', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ theme: 'metallic' })
        api.setAppConfig.mockImplementationOnce(async (config: Record<string, unknown>) => config)

        const result = await settingsService.setPlateauTitleDragDropEnabled(false)

        expect(result).toBe(false)
        expect(api.setAppConfig).toHaveBeenCalledWith({
            theme: 'metallic',
            enablePlateauTitleDragDrop: false,
        })
    })

    it('restores the saved value', async () => {
        const api = (window as any).electronAPI
        api.getAppConfig.mockResolvedValueOnce({ enablePlateauTitleDragDrop: false })

        await expect(settingsService.getPlateauTitleDragDropEnabled()).resolves.toBe(false)
    })

    it('uses fallback for invalid values', () => {
        expect(getPlateauTitleDragDropSetting({ enablePlateauTitleDragDrop: 'false' })).toBe(true)
        expect(getPlateauTitleDragDropSetting({ enablePlateauTitleDragDrop: 0 })).toBe(true)
        expect(createConfigWithPlateauTitleDragDropSetting(null, false)).toEqual({
            enablePlateauTitleDragDrop: false,
        })
    })
})
