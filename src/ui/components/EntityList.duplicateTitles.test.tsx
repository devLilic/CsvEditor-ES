import { cleanup, render, screen } from '@testing-library/react'
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
    reorderPlateauTitleItems: vi.fn(),
    select: vi.fn(),
    isSelected: vi.fn(() => false),
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
    }
})

function title(id: string, value: string) {
    return {
        type: 'title',
        entityType: 'titles',
        id,
        rowId: `row-${id}`,
        data: { title: value },
    }
}

function divider(id: string) {
    return { type: 'divider', id }
}

function setItems(items: unknown[]) {
    csvHooks.getBlockItems = vi.fn(() => items)
}

function renderEntityList() {
    return render(
        <EditModeProvider>
            <TitleFilterProvider>
                <EntityList />
            </TitleFilterProvider>
        </EditModeProvider>
    )
}

function rowFor(text: string) {
    return screen.getAllByText(text)[0].closest('.group')
}

function expectMarked(text: string) {
    expect(rowFor(text)).toHaveClass('bg-[var(--duplicate-title-bg)]')
    expect(rowFor(text)).toHaveClass('border-l-[var(--duplicate-title-border)]')
    expect(rowFor(text)).toHaveClass('text-[var(--duplicate-title-text)]')
}

function expectNotMarked(text: string) {
    expect(rowFor(text)).not.toHaveClass('bg-[var(--duplicate-title-bg)]')
    expect(rowFor(text)).not.toHaveClass('border-l-[var(--duplicate-title-border)]')
    expect(rowFor(text)).not.toHaveClass('text-[var(--duplicate-title-text)]')
}

beforeEach(() => {
    csvHooks.activeSectionId = 'invited-1'
    csvHooks.activeSection = { id: 'invited-1', kind: 'invited', rows: [] }
    csvHooks.activeEntityType = 'titles'
    csvHooks.getBlockItems = vi.fn(() => [])
    csvHooks.deleteEntity.mockClear()
    csvHooks.deletePlateauTitleDivider.mockReset()
    csvHooks.deletePlateauTitleDivider.mockResolvedValue({ ok: true })
    csvHooks.reorderPlateauTitleItems.mockReset()
    csvHooks.reorderPlateauTitleItems.mockResolvedValue({ ok: true })
    csvHooks.select.mockClear()
    csvHooks.isSelected.mockClear()
    csvHooks.isSelected.mockReturnValue(false)
})

afterEach(() => {
    cleanup()
})

describe('EntityList duplicate PLATOU titles', () => {
    it('marks two duplicate titles', () => {
        setItems([
            title('title-1', 'ECONOMIE'),
            title('title-2', 'SPORT'),
            title('title-3', 'ECONOMIE'),
        ])

        renderEntityList()

        expectMarked('ECONOMIE')
        expect(screen.getAllByText('ECONOMIE')).toHaveLength(2)
        screen.getAllByText('ECONOMIE').forEach((node) => {
            expect(node.closest('.group')).toHaveClass('bg-[var(--duplicate-title-bg)]')
        })
    })

    it('does not mark a unique title', () => {
        setItems([
            title('title-1', 'ECONOMIE'),
            title('title-2', 'SPORT'),
        ])

        renderEntityList()

        expectNotMarked('ECONOMIE')
        expectNotMarked('SPORT')
    })

    it('marks case-insensitive duplicates', () => {
        setItems([
            title('title-1', 'ECONOMIE'),
            title('title-2', 'economie'),
        ])

        renderEntityList()

        expectMarked('ECONOMIE')
        expectMarked('economie')
    })

    it('marks trimmed duplicates', () => {
        setItems([
            title('title-1', 'ECONOMIE'),
            title('title-2', 'ECONOMIE '),
        ])

        renderEntityList()

        const rows = screen.getAllByText('ECONOMIE').map((node) => node.closest('.group'))

        expect(rows).toHaveLength(2)
        rows.forEach((row) => {
            expect(row).toHaveClass('bg-[var(--duplicate-title-bg)]')
            expect(row).toHaveClass('border-l-[var(--duplicate-title-border)]')
            expect(row).toHaveClass('text-[var(--duplicate-title-text)]')
        })
    })

    it('does not mark the divider', () => {
        setItems([
            title('title-1', 'ECONOMIE'),
            divider('divider-1'),
            title('title-2', 'ECONOMIE'),
        ])

        renderEntityList()

        expect(screen.getByTestId('plateau-title-divider')).not.toHaveClass('bg-[var(--duplicate-title-bg)]')
        expect(screen.getByTestId('plateau-title-divider')).not.toHaveClass('border-l-[var(--duplicate-title-border)]')
        expect(screen.getByTestId('plateau-title-divider')).not.toHaveClass('text-[var(--duplicate-title-text)]')
    })

    it('removes marking after deleting the duplicate title', () => {
        setItems([
            title('title-1', 'ECONOMIE'),
            title('title-2', 'ECONOMIE'),
        ])
        const view = renderEntityList()
        expectMarked('ECONOMIE')

        setItems([
            title('title-1', 'ECONOMIE'),
        ])
        view.rerender(
            <EditModeProvider>
                <TitleFilterProvider>
                    <EntityList />
                </TitleFilterProvider>
            </EditModeProvider>
        )

        expectNotMarked('ECONOMIE')
    })

    it('marks both titles after import adds a duplicate occurrence', () => {
        setItems([
            title('title-1', 'ECONOMIE'),
        ])
        const view = renderEntityList()
        expectNotMarked('ECONOMIE')

        setItems([
            title('title-1', 'ECONOMIE'),
            title('title-2', 'ECONOMIE'),
        ])
        view.rerender(
            <EditModeProvider>
                <TitleFilterProvider>
                    <EntityList />
                </TitleFilterProvider>
            </EditModeProvider>
        )

        screen.getAllByText('ECONOMIE').forEach((node) => {
            expect(node.closest('.group')).toHaveClass('bg-[var(--duplicate-title-bg)]')
            expect(node.closest('.group')).toHaveClass('border-l-[var(--duplicate-title-border)]')
            expect(node.closest('.group')).toHaveClass('text-[var(--duplicate-title-text)]')
        })
    })
})
