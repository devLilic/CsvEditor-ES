import { cleanup, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EntityList } from './EntityList'
import { EditModeProvider, useEditMode } from '@/ui/context/EditModeContext'
import { TitleFilterProvider } from '@/ui/context/TitleFilterContext'
import { TITLE_DIVIDER_MARKER } from '@/features/csv-editor'
import { settingsService } from '@/features/csv-editor/services/settingsService'

const dndHooks = vi.hoisted(() => ({
    onDragEnd: null as null | ((event: any) => void),
    sortableTransform: null as null | { x: number; y: number; scaleX: number; scaleY: number },
}))

vi.mock('@dnd-kit/core', async () => {
    const React = await import('react')

    return {
        DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: any) => void }) => {
            dndHooks.onDragEnd = onDragEnd
            return <div data-testid="dnd-context">{children}</div>
        },
        closestCenter: vi.fn(),
        KeyboardSensor: vi.fn(),
        PointerSensor: vi.fn(),
        useSensor: vi.fn((sensor) => sensor),
        useSensors: vi.fn((...sensors) => sensors),
    }
})

vi.mock('@dnd-kit/sortable', async () => {
    const React = await import('react')

    return {
        SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
        verticalListSortingStrategy: {},
        sortableKeyboardCoordinates: vi.fn(),
        useSortable: ({ id }: { id: string }) => ({
            attributes: { 'data-sortable-id': id },
            listeners: { onPointerDown: vi.fn() },
            setNodeRef: vi.fn(),
            transform: dndHooks.sortableTransform,
            transition: undefined,
            isDragging: false,
        }),
    }
})

vi.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Transform: {
            toString: vi.fn((transform) => transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : ''),
        },
    },
}))

vi.mock('@/features/csv-editor/services/settingsService', () => ({
    settingsService: {
        getPlateauTitleDragDropEnabled: vi.fn(),
    },
}))

const csvHooks = vi.hoisted(() => ({
    activeSectionId: 'invited-1',
    activeSection: { id: 'invited-1', kind: 'invited', rows: [] as unknown[] } as any,
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
    reorderPlateauTitleItems: vi.fn(),
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
            reorderPlateauTitleItems: csvHooks.reorderPlateauTitleItems,
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

function EditModeOn() {
    const { toggleEditMode } = useEditMode()

    return <button onClick={toggleEditMode}>toggle edit mode</button>
}

function renderEntityList({ editMode = true } = {}) {
    const view = render(
        <EditModeProvider>
            <TitleFilterProvider>
                {editMode && <EditModeOn />}
                <EntityList />
            </TitleFilterProvider>
        </EditModeProvider>
    )

    if (editMode) {
        act(() => {
            screen.getByRole('button', { name: 'toggle edit mode' }).click()
        })
    }

    return view
}

function mixedPlateauItems() {
    return [
        { type: 'title', entityType: 'titles', id: 'title-1', rowId: 'row-title-1', data: { title: 'FIRST TITLE' } },
        { type: 'divider', id: 'divider-1' },
        { type: 'title', entityType: 'titles', id: 'title-2', rowId: 'row-title-2', data: { title: 'SECOND TITLE' } },
        { type: 'divider', id: 'divider-2' },
    ]
}

beforeEach(() => {
    dndHooks.onDragEnd = null
    dndHooks.sortableTransform = null
    csvHooks.activeSectionId = 'invited-1'
    csvHooks.activeSection = { id: 'invited-1', kind: 'invited', rows: [] }
    csvHooks.activeEntityType = 'titles'
    csvHooks.getBlockItems.mockReset()
    csvHooks.getBlockItems.mockReturnValue(mixedPlateauItems())
    csvHooks.deleteEntity.mockClear()
    csvHooks.deletePlateauTitleDivider.mockReset()
    csvHooks.deletePlateauTitleDivider.mockResolvedValue({ ok: true })
    csvHooks.reorderPlateauTitleItems.mockReset()
    csvHooks.reorderPlateauTitleItems.mockResolvedValue({ ok: true })
    csvHooks.select.mockClear()
    csvHooks.isSelected.mockClear()
    csvHooks.isSelected.mockReturnValue(false)
    csvHooks.isOnAir.mockClear()
    csvHooks.isOnAir.mockReturnValue(false)
    csvHooks.setOnAir.mockClear()
    csvHooks.clearOnAir.mockClear()
    vi.mocked(settingsService.getPlateauTitleDragDropEnabled).mockReset()
    vi.mocked(settingsService.getPlateauTitleDragDropEnabled).mockResolvedValue(true)
})

afterEach(() => {
    cleanup()
})

describe('EntityList title drag-and-drop', () => {
    it('shows handles in PLATOU Titles with Edit Mode and setting enabled', async () => {
        renderEntityList()

        expect(await screen.findAllByRole('button', { name: 'Muta elementul' })).toHaveLength(4)
    })

    it('keeps sortable movement on the vertical axis', async () => {
        dndHooks.sortableTransform = { x: 240, y: 18, scaleX: 1, scaleY: 1 }

        renderEntityList()

        const handle = (await screen.findAllByRole('button', { name: 'Muta elementul' }))[0]
        const sortableRow = handle.closest('[style]')

        expect(sortableRow?.getAttribute('style')).toContain('translate3d(0px, 18px, 0)')
    })

    it('renders the title drag handle before the title number', async () => {
        renderEntityList()

        const handle = (await screen.findAllByRole('button', { name: 'Muta elementul' }))[0]
        const number = screen.getByText('1.')

        expect(Boolean(handle.compareDocumentPosition(number) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    })

    it('hides handles in normal mode', () => {
        renderEntityList({ editMode: false })

        expect(screen.queryByRole('button', { name: 'Muta elementul' })).not.toBeInTheDocument()
    })

    it('hides handles when the setting is false', async () => {
        vi.mocked(settingsService.getPlateauTitleDragDropEnabled).mockResolvedValue(false)

        renderEntityList()

        expect(screen.queryByRole('button', { name: 'Muta elementul' })).not.toBeInTheDocument()
    })

    it('hides handles in BETA', () => {
        csvHooks.activeSectionId = 'beta-1'
        csvHooks.activeSection = { id: 'beta-1', kind: 'beta', rows: [] }
        csvHooks.getBlockItems.mockReturnValue([
            { type: 'title', entityType: 'titles', id: 'title-1', rowId: 'row-title-1', data: { title: 'BETA TITLE' } },
        ])

        renderEntityList()

        expect(screen.queryByRole('button', { name: 'Muta elementul' })).not.toBeInTheDocument()
    })

    it('renders the divider as a visual line', () => {
        renderEntityList()

        expect(screen.getAllByRole('separator')).toHaveLength(2)
    })

    it('does not render the CSV divider marker', () => {
        renderEntityList()

        expect(screen.queryByText(TITLE_DIVIDER_MARKER)).not.toBeInTheDocument()
    })

    it('shows an error for an invalid drop', async () => {
        renderEntityList()
        await screen.findByTestId('dnd-context')

        await act(async () => {
            await dndHooks.onDragEnd?.({
                active: { id: 'divider-2' },
                over: { id: 'divider-1' },
            })
        })

        expect(await screen.findByRole('alert')).toHaveTextContent('Nu pot exista două separatoare consecutive.')
    })

    it('does not start persistence for an invalid drop', async () => {
        renderEntityList()
        await screen.findByTestId('dnd-context')

        await act(async () => {
            await dndHooks.onDragEnd?.({
                active: { id: 'divider-2' },
                over: { id: 'divider-1' },
            })
        })

        expect(csvHooks.reorderPlateauTitleItems).not.toHaveBeenCalled()
    })
})
