import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TitleBackupImportReadResult } from '@/features/title-backup/services/titleBackupImportService'
import { ImportTitlesFromBackupDialog } from './ImportTitlesFromBackupDialog'

function createService(input?: {
    files?: string[]
    reads?: Record<string, TitleBackupImportReadResult>
}) {
    const files = input?.files ?? ['03_07_2026_titluri.csv']
    const reads = input?.reads ?? {
        '03_07_2026_titluri.csv': {
            ok: true,
            filename: '03_07_2026_titluri.csv',
            valid: true,
            errors: [],
            items: [
                { type: 'title', title: 'Primul titlu' },
                { type: 'divider' },
                { type: 'title', title: 'Al doilea titlu' },
            ],
        },
    }

    return {
        listBackups: vi.fn(async () => ({ ok: true, files })),
        readBackup: vi.fn(async (filename: string) => reads[filename]),
    }
}

async function renderDialog(options?: {
    service?: ReturnType<typeof createService>
    onImport?: ReturnType<typeof vi.fn>
    onClose?: ReturnType<typeof vi.fn>
}) {
    const service = options?.service ?? createService()
    const onImport = options?.onImport ?? vi.fn()
    const onClose = options?.onClose ?? vi.fn()

    render(
        <ImportTitlesFromBackupDialog
            open
            service={service}
            onImport={onImport}
            onClose={onClose}
        />
    )

    await screen.findByText('03_07_2026_titluri.csv')

    return { service, onImport, onClose }
}

afterEach(() => {
    cleanup()
})

describe('ImportTitlesFromBackupDialog', () => {
    it('shows the file list', async () => {
        await renderDialog({
            service: createService({
                files: [
                    '03_07_2026_titluri.csv',
                    '03_07_2026_titluri_2.csv',
                ],
            }),
        })

        expect(screen.getByText('03_07_2026_titluri.csv')).toBeInTheDocument()
        expect(screen.getByText('03_07_2026_titluri_2.csv')).toBeInTheDocument()
    })

    it('shows titles', async () => {
        await renderDialog()

        expect(await screen.findByText('Primul titlu')).toBeInTheDocument()
        expect(screen.getByText('Al doilea titlu')).toBeInTheDocument()
    })

    it('shows the divider as a line', async () => {
        await renderDialog()

        expect(await screen.findByTestId('backup-title-divider')).toBeInTheDocument()
        expect(screen.getByRole('separator')).toBeInTheDocument()
    })

    it('does not show [ DIVIDER ]', async () => {
        await renderDialog()

        await screen.findByTestId('backup-title-divider')
        expect(screen.queryByText('[ DIVIDER ]')).not.toBeInTheDocument()
    })

    it('does not make the divider selectable', async () => {
        await renderDialog()

        await screen.findByTestId('backup-title-divider')
        expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    })

    it('allows multiple selection', async () => {
        const user = userEvent.setup()
        await renderDialog()

        await user.click(await screen.findByLabelText('Primul titlu'))
        await user.click(screen.getByLabelText('Al doilea titlu'))

        expect(screen.getByLabelText('Primul titlu')).toBeChecked()
        expect(screen.getByLabelText('Al doilea titlu')).toBeChecked()
    })

    it('keeps Import disabled without selection', async () => {
        await renderDialog()

        expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
    })

    it('keeps the order of selected titles', async () => {
        const user = userEvent.setup()
        const onImport = vi.fn()
        await renderDialog({ onImport })

        await user.click(await screen.findByLabelText('Al doilea titlu'))
        await user.click(screen.getByLabelText('Primul titlu'))
        await user.click(screen.getByRole('button', { name: 'Import' }))

        expect(onImport).toHaveBeenCalledWith([
            { type: 'title', title: 'Primul titlu' },
            { type: 'title', title: 'Al doilea titlu' },
        ])
    })

    it('shows a controlled invalid file error', async () => {
        await renderDialog({
            service: createService({
                reads: {
                    '03_07_2026_titluri.csv': {
                        ok: false,
                        filename: '03_07_2026_titluri.csv',
                        valid: false,
                        errors: ['Row 3 has a consecutive divider.'],
                        items: [
                            { type: 'title', title: 'Primul titlu' },
                            { type: 'divider' },
                            { type: 'divider' },
                        ],
                    },
                },
            }),
        })

        expect(await screen.findByRole('alert')).toHaveTextContent('Row 3 has a consecutive divider.')
    })

    it('closes on Escape', async () => {
        const onClose = vi.fn()
        await renderDialog({ onClose })

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        })

        expect(onClose).toHaveBeenCalledOnce()
    })
})
