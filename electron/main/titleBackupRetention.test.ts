import * as path from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    cleanupOldTitleBackups,
    listTitleBackupFiles,
    writeTitleBackupAtomic,
    type TitleBackupFs,
} from './title-backup-retention'

type MockFile = {
    mtimeMs: number
    isDirectory?: boolean
}

describe('title backup retention', () => {
    const backupFolderPath = 'C:/backups'
    let files: Record<string, MockFile>
    let deletedPaths: string[]

    function filePath(filename: string): string {
        return path.join(backupFolderPath, filename)
    }

    function createFs(overrides: Partial<TitleBackupFs> = {}): TitleBackupFs {
        return {
            async stat(targetPath: string) {
                if (targetPath === backupFolderPath) {
                    return {
                        isDirectory: () => true,
                        isFile: () => false,
                        mtimeMs: 0,
                    }
                }

                const file = files[targetPath]
                if (!file) {
                    throw new Error(`Missing file: ${targetPath}`)
                }

                return {
                    isDirectory: () => !!file.isDirectory,
                    isFile: () => !file.isDirectory,
                    mtimeMs: file.mtimeMs,
                }
            },
            async access() {
                return undefined
            },
            async readdir() {
                return Object.keys(files).map((fullPath) => path.basename(fullPath))
            },
            async readFile() {
                return ''
            },
            async writeFile() {
                return undefined
            },
            async rename() {
                return undefined
            },
            async unlink(targetPath: string) {
                deletedPaths.push(targetPath)
                delete files[targetPath]
            },
            ...overrides,
        }
    }

    beforeEach(() => {
        files = {}
        deletedPaths = []
    })

    it('filters only dedicated backups', async () => {
        files[filePath('03_07_2026_titluri.csv')] = { mtimeMs: 1 }
        files[filePath('03_07_2026_titluri_2.csv')] = { mtimeMs: 2 }
        files[filePath('03_07_2026_titluri_10.csv')] = { mtimeMs: 3 }
        files[filePath('03_07_2026_titluri_1.csv')] = { mtimeMs: 4 }
        files[filePath('03_07_2026_titles.csv')] = { mtimeMs: 5 }
        files[filePath('notes.txt')] = { mtimeMs: 6 }

        const result = await listTitleBackupFiles({
            backupFolderPath,
            fs: createFs(),
        })

        expect(result.map((file) => file.filename)).toEqual([
            '03_07_2026_titluri_10.csv',
            '03_07_2026_titluri_2.csv',
            '03_07_2026_titluri.csv',
        ])
    })

    it('ignores normal backups', async () => {
        for (let index = 0; index < 10; index += 1) {
            files[filePath(`03_07_2026_titluri_${index + 2}.csv`)] = { mtimeMs: index + 1 }
        }
        files[filePath('proiect_2026-07-03_12-00-00.csv')] = { mtimeMs: 0 }
        files[filePath('backup_2026-07-03_12-00-00.csv')] = { mtimeMs: 0 }

        await cleanupOldTitleBackups({
            backupFolderPath,
            activeTitleBackupFile: null,
            fs: createFs(),
        })

        expect(deletedPaths).toEqual([])
        expect(files[filePath('proiect_2026-07-03_12-00-00.csv')]).toBeTruthy()
        expect(files[filePath('backup_2026-07-03_12-00-00.csv')]).toBeTruthy()
    })

    it('keeps maximum 10 dedicated backups', async () => {
        files[filePath('03_07_2026_titluri.csv')] = { mtimeMs: 0 }
        for (let index = 2; index <= 11; index += 1) {
            files[filePath(`03_07_2026_titluri_${index}.csv`)] = { mtimeMs: index }
        }

        await cleanupOldTitleBackups({
            backupFolderPath,
            activeTitleBackupFile: null,
            fs: createFs(),
        })

        const remainingDedicated = Object.keys(files)
            .map((fullPath) => path.basename(fullPath))
            .filter((filename) => filename.includes('_titluri'))

        expect(remainingDedicated).toHaveLength(10)
    })

    it('deletes the oldest dedicated backup', async () => {
        files[filePath('03_07_2026_titluri.csv')] = { mtimeMs: 1 }
        for (let index = 2; index <= 11; index += 1) {
            files[filePath(`03_07_2026_titluri_${index}.csv`)] = { mtimeMs: index }
        }

        await cleanupOldTitleBackups({
            backupFolderPath,
            activeTitleBackupFile: null,
            fs: createFs(),
        })

        expect(deletedPaths).toEqual([
            filePath('03_07_2026_titluri.csv'),
        ])
    })

    it('does not delete the active backup', async () => {
        files[filePath('03_07_2026_titluri.csv')] = { mtimeMs: 1 }
        for (let index = 2; index <= 11; index += 1) {
            files[filePath(`03_07_2026_titluri_${index}.csv`)] = { mtimeMs: index }
        }

        await cleanupOldTitleBackups({
            backupFolderPath,
            activeTitleBackupFile: '03_07_2026_titluri.csv',
            fs: createFs(),
        })

        expect(deletedPaths).toEqual([
            filePath('03_07_2026_titluri_2.csv'),
        ])
        expect(files[filePath('03_07_2026_titluri.csv')]).toBeTruthy()
    })

    it('retries on write failure', async () => {
        const writeFile = vi.fn()
            .mockRejectedValueOnce(new Error('locked'))
            .mockRejectedValueOnce(new Error('still locked'))
            .mockResolvedValueOnce(undefined)
        const rename = vi.fn().mockResolvedValue(undefined)

        const result = await writeTitleBackupAtomic({
            backupFolderPath,
            filename: '03_07_2026_titluri.csv',
            content: 'Primul titlu',
            fs: createFs({ writeFile, rename }),
        })

        expect(result.ok).toBe(true)
        expect(writeFile).toHaveBeenCalledTimes(3)
        expect(rename).toHaveBeenCalledTimes(1)
    })

    it('cleans up temporary files', async () => {
        const writeFile = vi.fn().mockRejectedValue(new Error('locked'))

        const result = await writeTitleBackupAtomic({
            backupFolderPath,
            filename: '03_07_2026_titluri.csv',
            content: 'Primul titlu',
            fs: createFs({ writeFile }),
        })

        expect(result.ok).toBe(false)
        expect(deletedPaths).toEqual([
            `${filePath('03_07_2026_titluri.csv')}.1.tmp`,
            `${filePath('03_07_2026_titluri.csv')}.2.tmp`,
            `${filePath('03_07_2026_titluri.csv')}.3.tmp`,
        ])
    })
})
