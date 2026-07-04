import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EntityEditor } from './EntityEditor'
import { EditModeProvider } from '@/ui/context/EditModeContext'
import { TemplateDocumentProvider } from '@/features/template-editor/state/TemplateDocumentProvider'

const csvHooks = vi.hoisted(() => ({
    activeEntityType: 'titles' as
        | 'titles'
        | 'persons'
        | 'locations'
        | 'phoneCalls'
        | 'hotTitles'
        | 'waitTitles'
        | 'waitLocations',
    activeSectionId: 'invited-1' as string | null,
    activeSection: { id: 'invited-1', kind: 'invited', rows: [] } as any,
    addEntity: vi.fn(),
    updateEntity: vi.fn(),
    savePersonEntity: vi.fn(),
    addPlateauTitleDivider: vi.fn(),
    clearSelection: vi.fn(),
    setActiveEntityType: vi.fn((type) => {
        csvHooks.activeEntityType = type
    }),
    selected: null as null | { sectionId: string; entityType: 'titles' | 'persons'; id: string },
    getBlockItems: vi.fn(() => []),
    quickTitles: [] as string[],
    setAllQuickTitles: vi.fn(),
}))

vi.mock('@/features/csv-editor', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/csv-editor')>()

    return {
        ...actual,
        useEntities: () => ({
            activeSectionId: csvHooks.activeSectionId,
            activeSection: csvHooks.activeSection,
            getBlockItems: csvHooks.getBlockItems,
            addEntity: csvHooks.addEntity,
            updateEntity: csvHooks.updateEntity,
            savePersonEntity: csvHooks.savePersonEntity,
            addPlateauTitleDivider: csvHooks.addPlateauTitleDivider,
        }),
        useSelectedEntity: () => ({
            selected: csvHooks.selected,
            clearSelection: csvHooks.clearSelection,
        }),
        useActiveEntityType: () => ({
            activeViewType: csvHooks.activeEntityType,
            setActiveViewType: csvHooks.setActiveEntityType,
            activeEntityType: csvHooks.activeEntityType,
            setActiveEntityType: csvHooks.setActiveEntityType,
        }),
        useQuickTitles: () => ({
            quickTitles: csvHooks.quickTitles,
            addQuickTitle: vi.fn(),
            removeQuickTitle: vi.fn(),
            setAllQuickTitles: csvHooks.setAllQuickTitles,
        }),
    }
})

vi.mock('./phone-image/PhoneImageModal', () => ({
    PhoneImageModal: () => null,
}))

vi.mock('./title-backup/ImportTitlesFromBackupDialog', () => ({
    ImportTitlesFromBackupDialog: ({ open }: { open: boolean }) =>
        open ? <div role="dialog" aria-label="Import titluri din backup">Import modal</div> : null,
}))

function TestProviders({ children }: { children: ReactNode }) {
    return (
        <EditModeProvider>
            <TemplateDocumentProvider>
                {children}
            </TemplateDocumentProvider>
        </EditModeProvider>
    )
}

function renderEntityEditor() {
    return render(
        <TestProviders>
            <EntityEditor />
        </TestProviders>
    )
}

beforeEach(() => {
    csvHooks.activeEntityType = 'titles'
    csvHooks.activeSectionId = 'invited-1'
    csvHooks.activeSection = { id: 'invited-1', kind: 'invited', rows: [] }
    csvHooks.addEntity.mockClear()
    csvHooks.updateEntity.mockClear()
    csvHooks.savePersonEntity.mockReset()
    csvHooks.savePersonEntity.mockResolvedValue({ ok: true })
    csvHooks.addPlateauTitleDivider.mockReset()
    csvHooks.addPlateauTitleDivider.mockResolvedValue({ ok: true, dividerId: 'divider-1' })
    csvHooks.clearSelection.mockClear()
    csvHooks.setActiveEntityType.mockClear()
    csvHooks.selected = null
    csvHooks.getBlockItems.mockReset()
    csvHooks.getBlockItems.mockReturnValue([])
    csvHooks.quickTitles = []
    csvHooks.setAllQuickTitles.mockReset()
    csvHooks.setAllQuickTitles.mockResolvedValue(undefined)

    class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    Object.defineProperty(window, 'ResizeObserver', {
        writable: true,
        configurable: true,
        value: ResizeObserverMock,
    })
})

afterEach(() => {
    cleanup()
})

describe('EntityEditor import titles from backup button', () => {
    it('appears in PLATOU Titles', () => {
        renderEntityEditor()

        expect(screen.getByRole('button', { name: 'Importă din backup' })).toBeInTheDocument()
    })

    it('does not appear in BETA', () => {
        csvHooks.activeSectionId = 'beta-1'
        csvHooks.activeSection = { id: 'beta-1', kind: 'beta', betaIndex: 1, betaTitle: 'Beta', rows: [] }

        renderEntityEditor()

        expect(screen.queryByRole('button', { name: 'Importă din backup' })).not.toBeInTheDocument()
    })

    it('does not appear for Persons', () => {
        csvHooks.activeEntityType = 'persons'

        renderEntityEditor()

        expect(screen.queryByRole('button', { name: 'Importă din backup' })).not.toBeInTheDocument()
    })

    it('is separated from Add', () => {
        renderEntityEditor()

        const addButton = screen.getByRole('button', { name: /Adaug/i })
        const importButton = screen.getByRole('button', { name: 'Importă din backup' })

        expect(addButton).not.toBe(importButton)
        expect(importButton).toHaveClass('ml-6')
    })

    it('opens the modal on click', async () => {
        const user = userEvent.setup()
        renderEntityEditor()

        await user.click(screen.getByRole('button', { name: 'Importă din backup' }))

        expect(screen.getByRole('dialog', { name: 'Import titluri din backup' })).toBeInTheDocument()
    })
})
