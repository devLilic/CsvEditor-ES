import { describe, expect, it, vi } from 'vitest'
import type { EntitiesState } from '@/features/csv-editor/domain/entities'
import { createTitleDivider } from '@/features/csv-editor/domain/plateauTitleList'
import { writeActiveTitleBackup } from './writeActiveTitleBackup'

function entitiesWithPlateauDividers(): EntitiesState {
    return {
        sections: [
            {
                id: 'beta',
                kind: 'beta',
                betaIndex: 1,
                betaTitle: 'Beta',
                rows: [
                    { id: 'beta-title', title: { id: 'bt', title: 'Beta title' } },
                    { id: 'beta-divider', titleDivider: createTitleDivider('bd') },
                ],
            },
            {
                id: 'invited',
                kind: 'invited',
                rows: [
                    { id: 'title-1', title: { id: 't1', nr: '1', title: 'Primul titlu' } },
                    { id: 'divider', titleDivider: createTitleDivider('divider') },
                    { id: 'title-2', title: { id: 't2', nr: '2', title: 'Al doilea titlu' } },
                ],
            },
        ],
    }
}

describe('writeActiveTitleBackup', () => {
    it('does not write before PA_titles.csv', async () => {
        const calls: string[] = []
        const writeTitleBackup = vi.fn(async () => {
            calls.push('backup')
            return { ok: true }
        })

        await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => {
                    calls.push('pa-titles')
                    return { ok: true }
                },
                getActiveTitleBackupFile: async () => '03_07_2026_titluri.csv',
                writeTitleBackup,
            },
        })

        expect(calls).toEqual(['pa-titles', 'backup'])
    })

    it('writes after PA_titles.csv succeeds', async () => {
        const writeTitleBackup = vi.fn(async () => ({ ok: true }))

        const result = await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => ({ ok: true }),
                getActiveTitleBackupFile: async () => '03_07_2026_titluri.csv',
                writeTitleBackup,
            },
        })

        expect(result).toMatchObject({ ok: true, backupAttempted: true, backupOk: true })
        expect(writeTitleBackup).toHaveBeenCalledOnce()
    })

    it('does not write if PA_titles.csv fails', async () => {
        const writeTitleBackup = vi.fn(async () => ({ ok: true }))

        const result = await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => ({ ok: false, error: 'PA_FAILED' }),
                getActiveTitleBackupFile: async () => '03_07_2026_titluri.csv',
                writeTitleBackup,
            },
        })

        expect(result).toEqual({
            ok: false,
            paTitlesOk: false,
            backupAttempted: false,
            backupOk: false,
            error: 'PA_FAILED',
        })
        expect(writeTitleBackup).not.toHaveBeenCalled()
    })

    it('backup failure does not produce rollback', async () => {
        const onBackupError = vi.fn()

        const result = await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => ({ ok: true }),
                getActiveTitleBackupFile: async () => '03_07_2026_titluri.csv',
                writeTitleBackup: async () => ({ ok: false, error: 'LOCKED' }),
                onBackupError,
            },
        })

        expect(result).toEqual({
            ok: true,
            paTitlesOk: true,
            backupAttempted: true,
            backupOk: false,
        })
        expect(onBackupError).toHaveBeenCalledWith({
            filename: '03_07_2026_titluri.csv',
            message: 'LOCKED',
        })
    })

    it('uses activeTitleBackupFile', async () => {
        const writeTitleBackup = vi.fn(async () => ({ ok: true }))

        await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => ({ ok: true }),
                getActiveTitleBackupFile: async () => '03_07_2026_titluri_2.csv',
                writeTitleBackup,
            },
        })

        expect(writeTitleBackup).toHaveBeenCalledWith(expect.objectContaining({
            filename: '03_07_2026_titluri_2.csv',
        }))
    })

    it('content has no header', async () => {
        const writeTitleBackup = vi.fn(async () => ({ ok: true }))

        await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => ({ ok: true }),
                getActiveTitleBackupFile: async () => '03_07_2026_titluri.csv',
                writeTitleBackup,
            },
        })

        expect(writeTitleBackup.mock.calls[0][0].content.split('\n')[0]).toBe('Primul titlu')
    })

    it('content has no Nr', async () => {
        const writeTitleBackup = vi.fn(async () => ({ ok: true }))

        await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => ({ ok: true }),
                getActiveTitleBackupFile: async () => '03_07_2026_titluri.csv',
                writeTitleBackup,
            },
        })

        expect(writeTitleBackup.mock.calls[0][0].content).not.toContain('Nr')
    })

    it('content keeps dividers', async () => {
        const writeTitleBackup = vi.fn(async () => ({ ok: true }))

        await writeActiveTitleBackup({
            entities: entitiesWithPlateauDividers(),
            deps: {
                writePaTitlesCsv: async () => ({ ok: true }),
                getActiveTitleBackupFile: async () => '03_07_2026_titluri.csv',
                writeTitleBackup,
            },
        })

        expect(writeTitleBackup.mock.calls[0][0].content).toBe([
            'Primul titlu',
            '[ DIVIDER ]',
            'Al doilea titlu',
        ].join('\n'))
    })
})
