import type { CsvFileSettings } from '@/features/csv-editor/domain/csvFileSettings'
import { csvFileSettingsService } from '@/features/csv-editor/services/csvFileSettingsService'
import type { RendererApi } from '@/shared/ipc-types'
import { isValidActiveTitleBackupFile } from '../domain/activeTitleBackupFile'
import {
    parseTitleBackup,
    type TitleBackupListItem,
} from '../domain/titleBackupCsv'

export type TitleBackupImportFile = {
    filename: string
    mtimeMs: number
}

export type TitleBackupImportListResult =
    | {
        ok: true
        files: string[]
    }
    | {
        ok: false
        files: string[]
        error: string
    }

export type TitleBackupImportReadResult = {
    ok: boolean
    filename: string
    items: TitleBackupListItem[]
    valid: boolean
    errors: string[]
}

export type TitleBackupImportServiceDeps = {
    getCsvFileSettings(): Promise<CsvFileSettings>
    listBackupFiles(backupFolderPath: string): Promise<TitleBackupImportFile[]>
    readBackupFile(backupFolderPath: string, filename: string): Promise<string>
}

function getApi(): RendererApi {
    const api = (window as Window & { electronAPI?: RendererApi }).electronAPI
    if (!api) {
        throw new Error('electronAPI not available')
    }

    return api
}

export function createTitleBackupImportService(deps: TitleBackupImportServiceDeps) {
    async function getBackupFolderPath(): Promise<string> {
        const settings = await deps.getCsvFileSettings()
        return settings.backupFolderPath.trim()
    }

    return {
        async listBackups(): Promise<TitleBackupImportListResult> {
            try {
                const backupFolderPath = await getBackupFolderPath()
                const files = await deps.listBackupFiles(backupFolderPath)

                return {
                    ok: true,
                    files: files
                        .filter((file) => isValidActiveTitleBackupFile(file.filename))
                        .sort((a, b) => b.mtimeMs - a.mtimeMs)
                        .map((file) => file.filename),
                }
            } catch (error) {
                return {
                    ok: false,
                    files: [],
                    error: error instanceof Error ? error.message : 'TITLE_BACKUP_LIST_FAILED',
                }
            }
        },

        async readBackup(filename: string): Promise<TitleBackupImportReadResult> {
            if (!isValidActiveTitleBackupFile(filename)) {
                return {
                    ok: false,
                    filename,
                    items: [],
                    valid: false,
                    errors: ['Invalid title backup filename.'],
                }
            }

            try {
                const backupFolderPath = await getBackupFolderPath()
                const content = await deps.readBackupFile(backupFolderPath, filename)
                const parsed = parseTitleBackup(content)

                return {
                    ok: parsed.valid,
                    filename,
                    items: parsed.items,
                    valid: parsed.valid,
                    errors: parsed.errors,
                }
            } catch (error) {
                return {
                    ok: false,
                    filename,
                    items: [],
                    valid: false,
                    errors: [error instanceof Error ? error.message : 'TITLE_BACKUP_READ_FAILED'],
                }
            }
        },
    }
}

export const titleBackupImportService = createTitleBackupImportService({
    getCsvFileSettings: () => csvFileSettingsService.getCsvFileSettings(),
    listBackupFiles: async () => {
        const response = await getApi().listTitleBackups()
        if (!response.ok) {
            throw new Error(response.error ?? 'TITLE_BACKUP_LIST_FAILED')
        }

        return response.files.map((file) => ({
            filename: file.filename,
            mtimeMs: file.mtimeMs,
        }))
    },
    readBackupFile: async (_backupFolderPath, filename) => {
        const response = await getApi().readTitleBackup({ filename })
        if (!response.ok || typeof response.content !== 'string') {
            throw new Error(response.error ?? 'TITLE_BACKUP_READ_FAILED')
        }

        return response.content
    },
})
