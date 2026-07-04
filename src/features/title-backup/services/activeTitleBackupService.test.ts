import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppConfig } from '@/shared/ipc-types'
import type { CsvFileSettings } from '@/features/csv-editor/domain/csvFileSettings'
import { createActiveTitleBackupService } from './activeTitleBackupService'

describe('activeTitleBackupService', () => {
    const now = new Date('2026-07-03T10:00:00')
    const csvFileSettings: CsvFileSettings = {
        workingCsvPath: 'C:/work/current.csv',
        backupFolderPath: 'C:/work/backups',
        savedProjectsFolderPath: 'C:/work/projects',
        exportCsvFolderPath: 'C:/work/exports',
    }

    let config: AppConfig
    let backupFileNames: string[]
    let setConfig: ReturnType<typeof vi.fn>

    function createService() {
        setConfig = vi.fn(async (nextConfig: AppConfig) => {
            config = nextConfig
            return config
        })

        return createActiveTitleBackupService({
            getConfig: async () => config,
            setConfig,
            getCsvFileSettings: async () => csvFileSettings,
            listBackupFileNames: async () => backupFileNames,
            now: () => now,
        })
    }

    beforeEach(() => {
        config = {}
        backupFileNames = []
        setConfig = vi.fn()
    })

    it('keeps the existing identifier', async () => {
        config = {
            activeTitleBackupFile: '03_07_2026_titluri_2.csv',
        }
        const service = createService()

        await expect(service.initializeActiveTitleBackupFile())
            .resolves.toBe('03_07_2026_titluri_2.csv')
        expect(setConfig).not.toHaveBeenCalled()
    })

    it('gives the first project the name without suffix', async () => {
        const service = createService()

        await expect(service.initializeActiveTitleBackupFile())
            .resolves.toBe('03_07_2026_titluri.csv')
        expect(config.activeTitleBackupFile).toBe('03_07_2026_titluri.csv')
    })

    it('gives New Project _2', async () => {
        const service = createService()

        await service.initializeActiveTitleBackupFile()

        await expect(service.reserveNewProjectTitleBackupFile())
            .resolves.toBe('03_07_2026_titluri_2.csv')
        expect(config.activeTitleBackupFile).toBe('03_07_2026_titluri_2.csv')
    })

    it('keeps the same name after restart', async () => {
        const service = createService()

        const reservedName = await service.initializeActiveTitleBackupFile()
        const restartedService = createService()

        await expect(restartedService.initializeActiveTitleBackupFile())
            .resolves.toBe(reservedName)
        expect(config.activeTitleBackupFile).toBe('03_07_2026_titluri.csv')
    })

    it('only New Project changes the name', async () => {
        config = {
            activeTitleBackupFile: '03_07_2026_titluri.csv',
        }
        const service = createService()

        await expect(service.initializeActiveTitleBackupFile())
            .resolves.toBe('03_07_2026_titluri.csv')
        await expect(service.getActiveTitleBackupFile())
            .resolves.toBe('03_07_2026_titluri.csv')
        await expect(service.reserveNewProjectTitleBackupFile())
            .resolves.toBe('03_07_2026_titluri_2.csv')
    })

    it('does not let other backups influence the suffix', async () => {
        backupFileNames = [
            'proiect_2026-07-03_12-00-00.csv',
            'backup_2026-07-03_12-00-00.csv',
            '03_07_2026_titluri.csv',
        ]
        const service = createService()

        await expect(service.initializeActiveTitleBackupFile())
            .resolves.toBe('03_07_2026_titluri_2.csv')
    })
})
