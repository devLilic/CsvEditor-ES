import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EntityList } from './EntityList'
import { EditModeProvider } from '@/ui/context/EditModeContext'
import { TitleFilterProvider } from '@/ui/context/TitleFilterContext'

const csvHooks = vi.hoisted(() => ({
    activeSectionId: 'invited-1',
    activeSection: { id: 'invited-1', kind: 'invited', rows: [] as unknown[] },
    activeEntityType: 'titles' as
        | 'titles'
        | 'persons'
        | 'locations'
        | 'phoneCalls'
        | 'hotTitles'
        | 'waitTitles'
        | 'waitLocations',
    getBlockItems: vi.fn(),
    deleteEntity: vi.fn(),
    deletePlateauTitleDivider: vi.fn(),
    select: vi.fn(),
    isSelected: vi.fn(() => false),
    isOnAir: vi.fn(() => false),
    setOnAir: vi.fn(),
    clearOnAir: vi.fn(),
}))

vi.mock('@/features/csv-editor', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/csv-editor')>()

    return {
        ...actual,
        useEntities: () => ({
            activeSectionId: csvHooks.activeSectionId,
            activeSection: csvHooks.activeSection,
            getBlockItems: csvHooks.getBlockItems,
            deleteEntity: csvHooks.deleteEntity,
            deletePlateauTitleDivider: csvHooks.deletePlateauTitleDivider,
        }),
        useActiveEntityType: () => ({
            activeViewType: csvHooks.activeEntityType,
            activeEntityType: csvHooks.activeEntityType,
        }),
        useSelectedEntity: () => ({
            select: csvHooks.select,
            isSelected: csvHooks.isSelected,
        }),
        useOnAir: () => ({
            isOnAir: csvHooks.isOnAir,
            setOnAir: csvHooks.setOnAir,
            clearOnAir: csvHooks.clearOnAir,
        }),
    }
})

function renderEntityList() {
    return render(
        <EditModeProvider>
            <TitleFilterProvider>
                <EntityList />
            </TitleFilterProvider>
        </EditModeProvider>
    )
}

function mixedPlateauItems() {
    return [
        { type: 'title', entityType: 'titles', id: 'title-1', rowId: 'row-title-1', data: { title: 'FIRST TITLE' } },
        { type: 'divider', id: 'divider-1' },
        { type: 'title', entityType: 'titles', id: 'title-2', rowId: 'row-title-2', data: { title: 'SECOND TITLE' } },
    ]
}

beforeEach(() => {
    csvHooks.activeSectionId = 'invited-1'
    csvHooks.activeSection = { id: 'invited-1', kind: 'invited', rows: [] }
    csvHooks.activeEntityType = 'titles'
    csvHooks.getBlockItems.mockReset()
    csvHooks.deleteEntity.mockClear()
    csvHooks.deletePlateauTitleDivider.mockReset()
    csvHooks.deletePlateauTitleDivider.mockResolvedValue({ ok: true })
    csvHooks.select.mockClear()
    csvHooks.isSelected.mockClear()
    csvHooks.isSelected.mockReturnValue(false)
    csvHooks.isOnAir.mockClear()
    csvHooks.isOnAir.mockReturnValue(false)
    csvHooks.setOnAir.mockClear()
    csvHooks.clearOnAir.mockClear()
})

afterEach(() => {
    cleanup()
})

describe('EntityList PLATOU dividers', () => {
    it('renders mixed titles and divider in the correct order', () => {
        csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())

        renderEntityList()

        const list = screen.getByText('FIRST TITLE').closest('.rounded')
        expect(list?.children[0]).toHaveTextContent('FIRST TITLE')
        expect(list?.children[1]).toHaveAttribute('data-testid', 'plateau-title-divider')
        expect(list?.children[2]).toHaveTextContent('SECOND TITLE')
    })

    it('renders the divider as a visual line', () => {
        csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())

        renderEntityList()

        expect(screen.getByRole('separator')).toBeInTheDocument()
    })

    it('does not render the CSV marker as visible text', () => {
        csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())

        renderEntityList()

        expect(screen.queryByText('[ DIVIDER ]')).not.toBeInTheDocument()
    })

    it('does not number the divider', () => {
        csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())

        renderEntityList()

        expect(screen.getByText('1.')).toBeInTheDocument()
        expect(screen.getByText('2.')).toBeInTheDocument()
        expect(screen.queryByText('3.')).not.toBeInTheDocument()
    })

    it('does not select the divider', async () => {
        const user = userEvent.setup()
        csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())

        renderEntityList()
        await user.click(screen.getByTestId('plateau-title-divider'))

        expect(csvHooks.select).not.toHaveBeenCalled()
    })

    it('delete calls the divider operation with the correct id', async () => {
        const user = userEvent.setup()
        csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())

        renderEntityList()
        await user.click(screen.getByRole('button', { name: 'Sterge separatorul' }))

        expect(csvHooks.deletePlateauTitleDivider).toHaveBeenCalledWith('divider-1')
    })

    it('keeps the divider visible when delete fails', async () => {
        const user = userEvent.setup()
        csvHooks.deletePlateauTitleDivider.mockResolvedValueOnce({ ok: false, error: 'WRITE_FAILED' })
        csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())

        renderEntityList()
        await user.click(screen.getByRole('button', { name: 'Sterge separatorul' }))

        expect(screen.getByTestId('plateau-title-divider')).toBeInTheDocument()
        expect(await screen.findByRole('alert')).toHaveTextContent('WRITE_FAILED')
    })

    it('does not render divider controls in BETA', () => {
        csvHooks.activeSectionId = 'beta-1'
        csvHooks.activeSection = { id: 'beta-1', kind: 'beta', rows: [] }
        csvHooks.getBlockItems.mockReturnValue([
            { type: 'title', entityType: 'titles', id: 'title-1', rowId: 'beta-row-title-1', data: { title: 'BETA TITLE' } },
        ])

        renderEntityList()

        expect(screen.queryByTestId('plateau-title-divider')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Sterge separatorul' })).not.toBeInTheDocument()
    })
})
