import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EntityEditor } from './EntityEditor'
import { EditModeProvider } from '@/ui/context/EditModeContext'

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
    selected: null as null | { sectionId: string; entityType: 'titles'; id: string },
    quickTitles: ['INVITAT: ', 'MODERATOR: '] as string[],
    getBlockItems: vi.fn(() => []),
    addEntity: vi.fn(),
    updateEntity: vi.fn(),
    savePersonEntity: vi.fn(),
    clearSelection: vi.fn(),
    setActiveEntityType: vi.fn((type) => {
        csvHooks.activeEntityType = type
    }),
    setAllQuickTitles: vi.fn(),
}))

const phoneImageSettingsServiceMock = vi.hoisted(() => ({
    getPhoneImageSettings: vi.fn(),
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
            addPlateauTitleDivider: vi.fn(),
            importPlateauTitlesFromBackup: vi.fn(),
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

vi.mock('@/features/csv-editor/services/phoneImageSettingsService', () => ({
    phoneImageSettingsService: {
        getPhoneImageSettings: phoneImageSettingsServiceMock.getPhoneImageSettings,
    },
}))

vi.mock('@/features/template-editor/state/TemplateDocumentProvider', () => ({
    TemplateDocumentProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    useTemplateDocument: () => ({
        document: {
            templates: {
                titles: {},
                persons: {},
                locations: {},
                phoneCalls: {},
                hotTitles: {},
                waitTitles: {},
                waitLocations: {},
            },
        },
    }),
}))

vi.mock('./Preview16x9', () => ({
    Preview16x9: () => <div data-testid="preview16x9-root" />,
}))

beforeEach(() => {
    csvHooks.activeEntityType = 'titles'
    csvHooks.activeSectionId = 'invited-1'
    csvHooks.activeSection = { id: 'invited-1', kind: 'invited', rows: [] }
    csvHooks.selected = null
    csvHooks.quickTitles = ['INVITAT: ', 'MODERATOR: ']
    csvHooks.getBlockItems.mockReset()
    csvHooks.getBlockItems.mockReturnValue([])
    csvHooks.addEntity.mockClear()
    csvHooks.updateEntity.mockClear()
    csvHooks.savePersonEntity.mockReset()
    csvHooks.savePersonEntity.mockResolvedValue({ ok: true })
    csvHooks.clearSelection.mockClear()
    csvHooks.setActiveEntityType.mockClear()
    csvHooks.setAllQuickTitles.mockReset()
    phoneImageSettingsServiceMock.getPhoneImageSettings.mockReset()
    phoneImageSettingsServiceMock.getPhoneImageSettings.mockResolvedValue({})
})

afterEach(() => {
    cleanup()
})

function TestProviders({ children }: { children: ReactNode }) {
    return (
        <EditModeProvider>
            {children}
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

function titleInput() {
    return screen.getByLabelText('Titlu') as HTMLInputElement
}

async function seedRepeatedQuickTitle(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'INVITAT:' }))
    await user.type(titleInput(), 'Ion Popescu')
}

describe('EntityEditor repeated QuickTitle memory', () => {
    it('inserts the QuickTitle on first click', async () => {
        const user = userEvent.setup()
        renderEntityEditor()

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))

        expect(titleInput()).toHaveValue('INVITAT: ')
        expect(screen.getByRole('button', { name: 'INVITAT:' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', { name: 'MODERATOR:' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('keeps operator text typed after the QuickTitle', async () => {
        const user = userEvent.setup()
        renderEntityEditor()

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))
        await user.type(titleInput(), 'Ion Popescu')

        expect(titleInput()).toHaveValue('INVITAT: Ion Popescu')
    })

    it('resets the input on repeated click', async () => {
        const user = userEvent.setup()
        renderEntityEditor()
        await seedRepeatedQuickTitle(user)

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))

        expect(titleInput()).toHaveValue('INVITAT: ')
    })

    it('marks and repeats a QuickTitle created manually with lowercase text', async () => {
        const user = userEvent.setup()
        csvHooks.quickTitles = ['breaking: ']
        renderEntityEditor()

        await user.click(screen.getByRole('button', { name: 'BREAKING:' }))
        await user.type(titleInput(), 'Text curent')

        expect(titleInput()).toHaveValue('BREAKING: Text curent')
        expect(screen.getByRole('button', { name: 'BREAKING:' })).toHaveAttribute('aria-pressed', 'true')

        await user.click(screen.getByRole('button', { name: 'BREAKING:' }))

        expect(titleInput()).toHaveValue('BREAKING: ')
        expect(screen.getByRole('button', { name: 'BREAKING:' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('clears the active QuickTitle memory when the title input is emptied', async () => {
        const user = userEvent.setup()
        renderEntityEditor()

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))
        expect(screen.getByRole('button', { name: 'INVITAT:' })).toHaveAttribute('aria-pressed', 'true')

        await user.clear(titleInput())

        expect(titleInput()).toHaveValue('')
        expect(screen.getByRole('button', { name: 'INVITAT:' })).toHaveAttribute('aria-pressed', 'false')

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))

        expect(titleInput()).toHaveValue('INVITAT: ')
        expect(screen.getByRole('button', { name: 'INVITAT:' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('does not use the previous prefix rule for another QuickTitle', async () => {
        const user = userEvent.setup()
        renderEntityEditor()
        await seedRepeatedQuickTitle(user)

        await user.click(screen.getByRole('button', { name: 'MODERATOR:' }))

        expect(titleInput()).toHaveValue('MODERATOR: Ion Popescu')
    })

    it('resets memory when another title is selected', async () => {
        const user = userEvent.setup()
        const view = renderEntityEditor()
        await seedRepeatedQuickTitle(user)

        csvHooks.selected = { sectionId: 'invited-1', entityType: 'titles', id: 'title-2' }
        csvHooks.getBlockItems.mockReturnValue([
            {
                entityType: 'titles',
                id: 'title-2',
                data: { title: 'INVITAT: Maria Ionescu' },
            },
        ])
        view.rerender(<TestProviders><EntityEditor /></TestProviders>)

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))

        expect(titleInput()).toHaveValue('INVITAT: Maria Ionescu')
    })

    it('resets memory when a new title create flow starts', async () => {
        const user = userEvent.setup()
        const view = renderEntityEditor()
        await seedRepeatedQuickTitle(user)

        csvHooks.selected = { sectionId: 'invited-1', entityType: 'titles', id: 'title-2' }
        csvHooks.getBlockItems.mockReturnValue([
            {
                entityType: 'titles',
                id: 'title-2',
                data: { title: 'MODERATOR: Maria Ionescu' },
            },
        ])
        view.rerender(<TestProviders><EntityEditor /></TestProviders>)

        csvHooks.selected = null
        csvHooks.getBlockItems.mockReturnValue([])
        view.rerender(<TestProviders><EntityEditor /></TestProviders>)

        await user.type(titleInput(), 'Maria Ionescu')
        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))

        expect(titleInput()).toHaveValue('INVITAT: Maria Ionescu')
    })

    it('resets memory when the section changes', async () => {
        const user = userEvent.setup()
        const view = renderEntityEditor()
        await seedRepeatedQuickTitle(user)

        csvHooks.activeSectionId = 'invited-2'
        csvHooks.activeSection = { id: 'invited-2', kind: 'invited', rows: [] }
        view.rerender(<TestProviders><EntityEditor /></TestProviders>)

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))

        expect(titleInput()).toHaveValue('INVITAT: Ion Popescu')
    })

    it('resets memory when the entity type changes', async () => {
        const user = userEvent.setup()
        const view = renderEntityEditor()
        await seedRepeatedQuickTitle(user)

        csvHooks.activeEntityType = 'persons'
        view.rerender(<TestProviders><EntityEditor /></TestProviders>)
        expect(screen.getByLabelText('Nume')).toBeInTheDocument()

        csvHooks.activeEntityType = 'titles'
        view.rerender(<TestProviders><EntityEditor /></TestProviders>)

        await user.click(screen.getByRole('button', { name: 'INVITAT:' }))

        expect(titleInput()).toHaveValue('INVITAT: Ion Popescu')
    })
})
