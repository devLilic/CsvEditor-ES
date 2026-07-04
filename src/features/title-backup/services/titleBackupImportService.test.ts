import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CsvFileSettings } from '@/features/csv-editor/domain/csvFileSettings'
import {
    createTitleBackupImportService,
    type TitleBackupImportFile,
} from './titleBackupImportService'

describe('titleBackupImportService', () => {
    const csvFileSettings: CsvFileSettings = {
        workingCsvPath: 'C:/work/current.csv',
        backupFolderPath: 'C:/work/backups',
        savedProjectsFolderPath: 'C:/work/projects',
        exportCsvFolderPath: 'C:/work/exports',
    }

    let files: TitleBackupImportFile[]
    let contents: Record<string, string>
    let listBackupFiles: ReturnType<typeof vi.fn>
    let readBackupFile: ReturnType<typeof vi.fn>

    function createService() {
        listBackupFiles = vi.fn(async (backupFolderPath: string) => {
            expect(backupFolderPath).toBe(csvFileSettings.backupFolderPath)
            return files
        })
        readBackupFile = vi.fn(async (backupFolderPath: string, filename: string) => {
            expect(backupFolderPath).toBe(csvFileSettings.backupFolderPath)
            return contents[filename] ?? ''
        })

        return createTitleBackupImportService({
            getCsvFileSettings: async () => csvFileSettings,
            listBackupFiles,
            readBackupFile,
        })
    }

    beforeEach(() => {
        files = []
        contents = {}
        listBackupFiles = vi.fn()
        readBackupFile = vi.fn()
    })

    it('lists only dedicated files', async () => {
        files = [
            { filename: '03_07_2026_titluri.csv', mtimeMs: 1 },
            { filename: '03_07_2026_titluri_2.csv', mtimeMs: 2 },
            { filename: '03_07_2026_titluri_10.csv', mtimeMs: 3 },
            { filename: '03_07_2026_titluri_1.csv', mtimeMs: 4 },
            { filename: '03_07_2026_titles.csv', mtimeMs: 5 },
        ]

        await expect(createService().listBackups()).resolves.toEqual({
            ok: true,
            files: [
                '03_07_2026_titluri_10.csv',
                '03_07_2026_titluri_2.csv',
                '03_07_2026_titluri.csv',
            ],
        })
    })

    it('excludes normal backups', async () => {
        files = [
            { filename: 'emisie_2026-07-03_12-00-00.csv', mtimeMs: 3 },
            { filename: 'backup_2026-07-03_12-00-00.csv', mtimeMs: 2 },
            { filename: '03_07_2026_titluri.csv', mtimeMs: 1 },
        ]

        await expect(createService().listBackups()).resolves.toEqual({
            ok: true,
            files: ['03_07_2026_titluri.csv'],
        })
    })

    it('sorts descending', async () => {
        files = [
            { filename: '03_07_2026_titluri.csv', mtimeMs: 10 },
            { filename: '03_07_2026_titluri_2.csv', mtimeMs: 30 },
            { filename: '03_07_2026_titluri_3.csv', mtimeMs: 20 },
        ]

        await expect(createService().listBackups()).resolves.toEqual({
            ok: true,
            files: [
                '03_07_2026_titluri_2.csv',
                '03_07_2026_titluri_3.csv',
                '03_07_2026_titluri.csv',
            ],
        })
    })

    it('reads a valid backup', async () => {
        contents['03_07_2026_titluri.csv'] = 'Primul titlu\nAl doilea titlu'

        await expect(createService().readBackup('03_07_2026_titluri.csv')).resolves.toEqual({
            ok: true,
            filename: '03_07_2026_titluri.csv',
            items: [
                { type: 'title', title: 'Primul titlu' },
                { type: 'title', title: 'Al doilea titlu' },
            ],
            valid: true,
            errors: [],
        })
    })

    it('keeps titles and dividers', async () => {
        contents['03_07_2026_titluri.csv'] = 'Primul titlu\n[ DIVIDER ]\nAl doilea titlu'

        const result = await createService().readBackup('03_07_2026_titluri.csv')

        expect(result.items).toEqual([
            { type: 'title', title: 'Primul titlu' },
            { type: 'divider' },
            { type: 'title', title: 'Al doilea titlu' },
        ])
    })

    it('returns a controlled result for an invalid file', async () => {
        contents['03_07_2026_titluri.csv'] = 'Primul titlu\n[ DIVIDER ]\n[ DIVIDER ]'

        const result = await createService().readBackup('03_07_2026_titluri.csv')

        expect(result.ok).toBe(false)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Row 3 has a consecutive divider.')
        expect(result.items).toEqual([
            { type: 'title', title: 'Primul titlu' },
            { type: 'divider' },
            { type: 'divider' },
        ])
    })

    it('does not let an invalid file block the list', async () => {
        files = [
            { filename: '03_07_2026_titluri.csv', mtimeMs: 1 },
            { filename: '03_07_2026_titluri_2.csv', mtimeMs: 2 },
        ]
        contents['03_07_2026_titluri.csv'] = '[ DIVIDER ]\n[ DIVIDER ]'

        await expect(createService().listBackups()).resolves.toEqual({
            ok: true,
            files: [
                '03_07_2026_titluri_2.csv',
                '03_07_2026_titluri.csv',
            ],
        })
        expect(readBackupFile).not.toHaveBeenCalled()
    })
})
