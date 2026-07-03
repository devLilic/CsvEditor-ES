import { describe, expect, it, vi } from 'vitest'
import { csvService } from '../services/csvService'
import { createTitleDivider, type PlateauTitleListItem } from '../domain/plateauTitleList'
import type { CsvSection } from '../domain/entities'
import { csvReducer } from './csv.reducer'
import { initialCsvState, type CsvState } from './csv.types'

function stateWithInvited(rows: CsvSection['rows']): CsvState {
    return {
        ...initialCsvState,
        entities: {
            sections: [{
                id: 'invited-1',
                kind: 'invited',
                rows,
            }],
        },
        isLoaded: true,
        activeSectionId: 'invited-1',
    }
}

function reorder(state: CsvState, items: PlateauTitleListItem[]) {
    return csvReducer(state, {
        type: 'TITLE_LIST_REORDER',
        payload: { sectionId: 'invited-1', items },
    })
}

describe('reorderPlateauTitleItems divider rules', () => {
    it('rejects dragging a divider next to another divider', () => {
        const state = stateWithInvited([
            { id: 'title-row-1', title: { id: 'title-1', title: 'Title 1' } },
            { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
            { id: 'title-row-2', title: { id: 'title-2', title: 'Title 2' } },
            { id: 'divider-row-2', titleDivider: createTitleDivider('divider-2') },
            { id: 'title-row-3', title: { id: 'title-3', title: 'Title 3' } },
        ])

        const nextState = reorder(state, [
            { type: 'title', rowId: 'title-row-1' },
            { type: 'divider', id: 'divider-1' },
            { type: 'divider', id: 'divider-2' },
            { type: 'title', rowId: 'title-row-2' },
            { type: 'title', rowId: 'title-row-3' },
        ])

        expect(nextState).toBe(state)
    })

    it('keeps the old order when a drop is invalid', () => {
        const state = stateWithInvited([
            { id: 'title-row-1', title: { id: 'title-1', title: 'Title 1' } },
            { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
            { id: 'title-row-2', title: { id: 'title-2', title: 'Title 2' } },
            { id: 'divider-row-2', titleDivider: createTitleDivider('divider-2') },
            { id: 'title-row-3', title: { id: 'title-3', title: 'Title 3' } },
        ])

        const nextState = reorder(state, [
            { type: 'title', rowId: 'title-row-1' },
            { type: 'divider', id: 'divider-2' },
            { type: 'divider', id: 'divider-1' },
            { type: 'title', rowId: 'title-row-2' },
            { type: 'title', rowId: 'title-row-3' },
        ])

        expect(nextState.entities.sections[0].rows.map((row) => row.id)).toEqual([
            'title-row-1',
            'divider-row-1',
            'title-row-2',
            'divider-row-2',
            'title-row-3',
        ])
    })

    it('does not trigger persistence for an invalid drop', () => {
        const writeSpy = vi.spyOn(csvService, 'write')
        const state = stateWithInvited([
            { id: 'title-row-1', title: { id: 'title-1', title: 'Title 1' } },
            { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
            { id: 'title-row-2', title: { id: 'title-2', title: 'Title 2' } },
            { id: 'divider-row-2', titleDivider: createTitleDivider('divider-2') },
        ])

        reorder(state, [
            { type: 'title', rowId: 'title-row-1' },
            { type: 'divider', id: 'divider-1' },
            { type: 'divider', id: 'divider-2' },
            { type: 'title', rowId: 'title-row-2' },
        ])

        expect(writeSpy).not.toHaveBeenCalled()
    })

    it('allows two dividers separated by a title', () => {
        const state = stateWithInvited([
            { id: 'title-row-1', title: { id: 'title-1', title: 'Title 1' } },
            { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
            { id: 'title-row-2', title: { id: 'title-2', title: 'Title 2' } },
            { id: 'divider-row-2', titleDivider: createTitleDivider('divider-2') },
            { id: 'title-row-3', title: { id: 'title-3', title: 'Title 3' } },
        ])

        const nextState = reorder(state, [
            { type: 'divider', id: 'divider-1' },
            { type: 'title', rowId: 'title-row-2' },
            { type: 'divider', id: 'divider-2' },
            { type: 'title', rowId: 'title-row-1' },
            { type: 'title', rowId: 'title-row-3' },
        ])

        expect(nextState).not.toBe(state)
        expect(nextState.entities.sections[0].rows.map((row) => row.titleDivider?.id ?? row.id)).toEqual([
            'divider-1',
            'title-row-2',
            'divider-2',
            'title-row-1',
            'title-row-3',
        ])
    })
})
