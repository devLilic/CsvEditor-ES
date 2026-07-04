import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EntityEditor } from './EntityEditor'
import { EditModeProvider, useEditMode } from '@/ui/context/EditModeContext'
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

function TestProviders({ children }: { children: ReactNode }) {
    return (
        <EditModeProvider>
            <TemplateDocumentProvider>
                {children}
            </TemplateDocumentProvider>
        </EditModeProvider>
    )
}

function EditModeToggle() {
    const { toggleEditMode } = useEditMode()

    return <button onClick={toggleEditMode}>toggle edit mode</button>
}

function renderEntityEditor({ withEditModeToggle = false } = {}) {
    return render(
        <TestProviders>
            {withEditModeToggle && <EditModeToggle />}
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

describe('EntityEditor add divider button', () => {
    it('appears in PLATOU Titles', () => {
        renderEntityEditor()

        expect(screen.getByRole('button', { name: 'Adauga separator vizual' })).toBeInTheDocument()
    })

    it('appears in PLATOU Titles when Edit Mode is OFF', () => {
        renderEntityEditor()

        expect(screen.getByRole('button', { name: 'Adauga separator vizual' })).toBeInTheDocument()
    })

    it('appears in PLATOU Titles when Edit Mode is ON', async () => {
        const user = userEvent.setup()
        renderEntityEditor({ withEditModeToggle: true })

        await user.click(screen.getByRole('button', { name: 'toggle edit mode' }))

        expect(screen.getByRole('button', { name: 'Adauga separator vizual' })).toBeInTheDocument()
    })

    it('does not appear in BETA', () => {
        csvHooks.activeSectionId = 'beta-1'
        csvHooks.activeSection = { id: 'beta-1', kind: 'beta', betaIndex: 1, betaTitle: 'Beta', rows: [] }

        renderEntityEditor()

        expect(screen.queryByRole('button', { name: 'Adauga separator vizual' })).not.toBeInTheDocument()
    })

    it('does not appear for Persons', () => {
        csvHooks.activeEntityType = 'persons'

        renderEntityEditor()

        expect(screen.queryByRole('button', { name: 'Adauga separator vizual' })).not.toBeInTheDocument()
    })

    it('does not depend on any drag-and-drop setting', () => {
        renderEntityEditor()

        expect(screen.getByRole('button', { name: 'Adauga separator vizual' })).toBeInTheDocument()
    })

    it('click without selection adds the divider at the end', async () => {
        const user = userEvent.setup()
        renderEntityEditor()

        await user.click(screen.getByRole('button', { name: 'Adauga separator vizual' }))

        expect(csvHooks.addPlateauTitleDivider).toHaveBeenCalledWith()
    })

    it('click with a selected title sends afterItemId', async () => {
        const user = userEvent.setup()
        csvHooks.selected = { sectionId: 'invited-1', entityType: 'titles', id: 'title-1' }
        csvHooks.getBlockItems.mockReturnValue([
            { type: 'title', entityType: 'titles', id: 'title-1', rowId: 'row-title-1', data: { title: 'FIRST TITLE' } },
        ])

        renderEntityEditor()
        await user.click(screen.getByRole('button', { name: 'Adauga separator vizual' }))

        expect(csvHooks.addPlateauTitleDivider).toHaveBeenCalledWith({ afterItemId: 'row-title-1' })
    })

    it('click does not modify the title form or open editor flows', async () => {
        const user = userEvent.setup()
        renderEntityEditor()

        await user.type(screen.getByLabelText('Titlu'), 'Breaking News')
        await user.click(screen.getByRole('button', { name: 'Adauga separator vizual' }))

        expect(screen.getByLabelText('Titlu')).toHaveValue('Breaking News')
        expect(csvHooks.addEntity).not.toHaveBeenCalled()
        expect(csvHooks.updateEntity).not.toHaveBeenCalled()
    })

    it('shows a save error when divider creation fails', async () => {
        const user = userEvent.setup()
        csvHooks.addPlateauTitleDivider.mockResolvedValueOnce({ ok: false, error: 'WRITE_FAILED' })

        renderEntityEditor()
        await user.click(screen.getByRole('button', { name: 'Adauga separator vizual' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('WRITE_FAILED')
    })

    it('does not keep an unsaved divider when divider creation fails', async () => {
        const user = userEvent.setup()
        csvHooks.addPlateauTitleDivider.mockResolvedValueOnce({ ok: false, error: 'WRITE_FAILED' })

        renderEntityEditor()
        await user.type(screen.getByLabelText('Titlu'), 'Existing draft')
        await user.click(screen.getByRole('button', { name: 'Adauga separator vizual' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('WRITE_FAILED')
        expect(csvHooks.addEntity).not.toHaveBeenCalled()
        expect(csvHooks.updateEntity).not.toHaveBeenCalled()
        expect(csvHooks.clearSelection).not.toHaveBeenCalled()
        expect(screen.getByLabelText('Titlu')).toHaveValue('Existing draft')
    })
})
