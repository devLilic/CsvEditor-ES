import type { AppConfig } from '@/shared/ipc-types'

export const ACTIVE_TITLE_BACKUP_FILE_CONFIG_KEY = 'activeTitleBackupFile'

const TITLE_BACKUP_FILE_PATTERN = /^\d{2}_\d{2}_\d{4}_titluri(?:_(?:[2-9]|\d{2,}))?\.csv$/

export function getActiveTitleBackupFile(config: AppConfig): string | null {
    const value = config[ACTIVE_TITLE_BACKUP_FILE_CONFIG_KEY]

    return typeof value === 'string' && isValidActiveTitleBackupFile(value)
        ? value
        : null
}

export function createConfigWithActiveTitleBackupFile(
    config: AppConfig | null | undefined,
    activeTitleBackupFile: string | null,
): AppConfig {
    return {
        ...(config && typeof config === 'object' ? config : {}),
        [ACTIVE_TITLE_BACKUP_FILE_CONFIG_KEY]: activeTitleBackupFile,
    }
}

export function isValidActiveTitleBackupFile(value: unknown): value is string {
    return typeof value === 'string' && TITLE_BACKUP_FILE_PATTERN.test(value)
}
