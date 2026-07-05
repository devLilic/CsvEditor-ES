import type { AppConfig } from '@/shared/ipc-types'

export const ENABLE_PLATEAU_TITLE_DIVIDER_CREATION_KEY = 'enablePlateauTitleDividerCreation' as const
export const DEFAULT_ENABLE_PLATEAU_TITLE_DIVIDER_CREATION = true

export function getPlateauTitleDividerCreationSetting(config: AppConfig): boolean {
    return config?.[ENABLE_PLATEAU_TITLE_DIVIDER_CREATION_KEY] === true ||
        config?.[ENABLE_PLATEAU_TITLE_DIVIDER_CREATION_KEY] === false
        ? config[ENABLE_PLATEAU_TITLE_DIVIDER_CREATION_KEY] as boolean
        : DEFAULT_ENABLE_PLATEAU_TITLE_DIVIDER_CREATION
}

export function createConfigWithPlateauTitleDividerCreationSetting(
    config: AppConfig | null | undefined,
    enabled: boolean
): AppConfig {
    const baseConfig = config && typeof config === 'object' ? config : {}

    return {
        ...baseConfig,
        [ENABLE_PLATEAU_TITLE_DIVIDER_CREATION_KEY]: enabled,
    }
}
