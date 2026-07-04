export type UiTheme = 'legacy' | 'metallic' | 'dark'

const DEFAULT_THEME: UiTheme = 'legacy'

export function resolveUiTheme(value?: unknown): UiTheme {
    return value === 'metallic' || value === 'legacy' || value === 'dark' ? value : DEFAULT_THEME
}

export function applyUiTheme(target: Pick<HTMLElement, 'dataset'>, value?: unknown): UiTheme {
    const theme = resolveUiTheme(value)
    target.dataset.theme = theme
    return theme
}
