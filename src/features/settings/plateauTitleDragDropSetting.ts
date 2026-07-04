import type { AppConfig } from '@/shared/ipc-types'

export const ENABLE_PLATEAU_TITLE_DRAG_DROP_KEY = 'enablePlateauTitleDragDrop' as const
export const DEFAULT_ENABLE_PLATEAU_TITLE_DRAG_DROP = true

export function getPlateauTitleDragDropSetting(config: AppConfig): boolean {
    return config?.[ENABLE_PLATEAU_TITLE_DRAG_DROP_KEY] === true ||
        config?.[ENABLE_PLATEAU_TITLE_DRAG_DROP_KEY] === false
        ? config[ENABLE_PLATEAU_TITLE_DRAG_DROP_KEY] as boolean
        : DEFAULT_ENABLE_PLATEAU_TITLE_DRAG_DROP
}

export function createConfigWithPlateauTitleDragDropSetting(
    config: AppConfig | null | undefined,
    enabled: boolean
): AppConfig {
    const baseConfig = config && typeof config === 'object' ? config : {}

    return {
        ...baseConfig,
        [ENABLE_PLATEAU_TITLE_DRAG_DROP_KEY]: enabled,
    }
}
