import type { AppConfig } from '@/shared/ipc-types'
import type { CsvFileSettings } from '@/features/csv-editor/domain/csvFileSettings'
import { csvFileSettingsService } from '@/features/csv-editor/services/csvFileSettingsService'
import { settingsService } from '@/features/csv-editor/services/settingsService'
import {
    createConfigWithActiveTitleBackupFile,
    getActiveTitleBackupFile,
} from '../domain/activeTitleBackupFile'
import { findNextTitleBackupName } from '../domain/titleBackupName'

export type ActiveTitleBackupServiceDeps = {
    getConfig(): Promise<AppConfig>
    setConfig(config: AppConfig): Promise<AppConfig>
    getCsvFileSettings(): Promise<CsvFileSettings>
    listBackupFileNames(backupFolderPath: string): Promise<string[]>
    now?(): Date
}

export type ActiveTitleBackupService = {
    initializeActiveTitleBackupFile(): Promise<string>
    reserveNewProjectTitleBackupFile(): Promise<string>
    getActiveTitleBackupFile(): Promise<string | null>
}

export function createActiveTitleBackupService(
    deps: ActiveTitleBackupServiceDeps,
): ActiveTitleBackupService {
    const getNow = () => deps.now?.() ?? new Date()

    async function reserve(date: Date, currentActiveFile: string | null): Promise<string> {
        const csvFileSettings = await deps.getCsvFileSettings()
        const backupFolderPath = csvFileSettings.backupFolderPath.trim()
        const existingFileNames = backupFolderPath
            ? await deps.listBackupFileNames(backupFolderPath)
            : []
        const unavailableFileNames = currentActiveFile
            ? [...existingFileNames, currentActiveFile]
            : existingFileNames

        const nextName = findNextTitleBackupName(date, unavailableFileNames)
        const currentConfig = await deps.getConfig()
        await deps.setConfig(createConfigWithActiveTitleBackupFile(currentConfig, nextName))

        return nextName
    }

    return {
        async initializeActiveTitleBackupFile(): Promise<string> {
            const config = await deps.getConfig()
            const activeFile = getActiveTitleBackupFile(config)

            if (activeFile) {
                return activeFile
            }

            return reserve(getNow(), null)
        },

        async reserveNewProjectTitleBackupFile(): Promise<string> {
            const config = await deps.getConfig()
            const activeFile = getActiveTitleBackupFile(config)

            return reserve(getNow(), activeFile)
        },

        async getActiveTitleBackupFile(): Promise<string | null> {
            return getActiveTitleBackupFile(await deps.getConfig())
        },
    }
}

export const activeTitleBackupService = createActiveTitleBackupService({
    getConfig: () => settingsService.getConfig(),
    setConfig: (config) => settingsService.setConfig(config),
    getCsvFileSettings: () => csvFileSettingsService.getCsvFileSettings(),
    listBackupFileNames: async () => [],
})
