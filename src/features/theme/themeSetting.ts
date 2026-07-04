import type { AppConfig } from '@/shared/ipc-types'
import { applyUiTheme, resolveUiTheme, type UiTheme } from './themeResolver'

export const UI_THEME_KEY = 'uiTheme' as const
export const DEFAULT_UI_THEME: UiTheme = 'legacy'

export function getUiThemeSetting(config: AppConfig | null | undefined): UiTheme {
    if (!config || typeof config !== 'object') {
        return DEFAULT_UI_THEME
    }

    return resolveUiTheme(config[UI_THEME_KEY])
}

export function createConfigWithUiThemeSetting(
    config: AppConfig | null | undefined,
    theme: UiTheme
): AppConfig {
    const baseConfig = config && typeof config === 'object' ? config : {}

    return {
        ...baseConfig,
        [UI_THEME_KEY]: resolveUiTheme(theme),
    }
}

export async function restoreUiThemeSetting(
    getConfig: () => Promise<AppConfig>,
    target: Pick<HTMLElement, 'dataset'> = document.documentElement
): Promise<UiTheme> {
    const theme = getUiThemeSetting(await getConfig())
    applyUiTheme(target, theme)
    return theme
}

export async function persistUiThemeSetting(
    getConfig: () => Promise<AppConfig>,
    setConfig: (config: AppConfig) => Promise<AppConfig>,
    theme: UiTheme,
    target: Pick<HTMLElement, 'dataset'> = document.documentElement
): Promise<UiTheme> {
    const currentConfig = await getConfig()
    const savedConfig = await setConfig(createConfigWithUiThemeSetting(currentConfig, theme))
    const savedTheme = getUiThemeSetting(savedConfig)
    applyUiTheme(target, savedTheme)
    return savedTheme
}
