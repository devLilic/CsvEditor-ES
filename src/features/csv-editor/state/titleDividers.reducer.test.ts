import { describe, expect, it } from 'vitest'
import { createTitleDivider, renumberPlateauTitles, type PlateauTitleListItem } from '../domain/plateauTitleList'
import type { CsvSection } from '../domain/entities'
import { csvReducer } from './csv.reducer'
import { initialCsvState, type CsvState } from './csv.types'

function stateWithSections(sections: CsvSection[], activeSectionId = sections[0]?.id ?? null): CsvState {
    return {
        ...initialCsvState,
        entities: { sections },
        isLoaded: true,
        activeSectionId,
    }
}

function invitedSection(overrides: Partial<CsvSection> = {}): CsvSection {
    return {
        id: 'invited-1',
        kind: 'invited',
        rows: [],
        ...overrides,
    }
}

function betaSection(overrides: Partial<CsvSection> = {}): CsvSection {
    return {
        id: 'beta-1',
        kind: 'beta',
        betaIndex: 1,
        betaTitle: 'Beta',
        rows: [],
        ...overrides,
    }
}

describe('csvReducer PLATOU title dividers', () => {
    it('adds a divider in PLATOU titles', () => {
        const state = stateWithSections([invitedSection()], 'invited-1')

        const nextState = csvReducer(state, {
            type: 'TITLE_DIVIDER_ADD',
            payload: { sectionId: 'invited-1', id: 'divider-1' },
        })

        expect(nextState.entities.sections[0].rows).toEqual([{
            id: 'divider-1',
            titleDivider: { type: 'divider', id: 'divider-1' },
        }])
    })

    it('rejects adding a divider in BETA', () => {
        const state = stateWithSections([betaSection(), invitedSection()], 'beta-1')

        const nextState = csvReducer(state, {
            type: 'TITLE_DIVIDER_ADD',
            payload: { sectionId: 'beta-1', id: 'divider-1' },
        })

        expect(nextState).toBe(state)
    })

    it('rejects adding a divider after an existing divider', () => {
        const state = stateWithSections([
            invitedSection({
                rows: [
                    { id: 'title-row-1', title: { id: 'title-1', title: 'Titlu 1' } },
                    { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
                ],
            }),
        ])

        const nextState = csvReducer(state, {
            type: 'TITLE_DIVIDER_ADD',
            payload: { sectionId: 'invited-1', id: 'divider-2' },
        })

        expect(nextState).toBe(state)
    })

    it('deletes a divider without deleting titles', () => {
        const state = stateWithSections([
            invitedSection({
                rows: [
                    { id: 'title-row-1', title: { id: 'title-1', title: 'Titlu 1' } },
                    { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
                    { id: 'title-row-2', title: { id: 'title-2', title: 'Titlu 2' } },
                ],
            }),
        ])

        const nextState = csvReducer(state, {
            type: 'TITLE_DIVIDER_DELETE',
            payload: { sectionId: 'invited-1', id: 'divider-1' },
        })

        expect(nextState.entities.sections[0].rows.map((row) => row.id)).toEqual([
            'title-row-1',
            'title-row-2',
        ])
        expect(nextState.entities.sections[0].rows.map((row) => row.title?.title)).toEqual([
            'Titlu 1',
            'Titlu 2',
        ])
    })

    it('reorders the complete mixed title list and keeps all items', () => {
        const state = stateWithSections([
            invitedSection({
                rows: [
                    { id: 'title-row-1', title: { id: 'title-1', title: 'Titlu 1' } },
                    { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
                    { id: 'title-row-2', title: { id: 'title-2', title: 'Titlu 2' } },
                ],
            }),
        ])

        const items: PlateauTitleListItem[] = [
            { type: 'title', rowId: 'title-row-2' },
            { type: 'divider', id: 'divider-1' },
            { type: 'title', rowId: 'title-row-1' },
        ]
        const nextState = csvReducer(state, {
            type: 'TITLE_LIST_REORDER',
            payload: { sectionId: 'invited-1', items },
        })

        expect(nextState.entities.sections[0].rows.map((row) => row.titleDivider ? row.titleDivider.id : row.id)).toEqual([
            'title-row-2',
            'divider-1',
            'title-row-1',
        ])
    })

    it('reorders without losing entities attached to title rows', () => {
        const state = stateWithSections([
            invitedSection({
                rows: [
                    {
                        id: 'title-row-1',
                        title: { id: 'title-1', title: 'Titlu 1' },
                        person: { id: 'person-1', name: 'Ion', occupation: 'Reporter' },
                    },
                    { id: 'title-row-2', title: { id: 'title-2', title: 'Titlu 2' } },
                ],
            }),
        ])

        const nextState = csvReducer(state, {
            type: 'TITLE_LIST_REORDER',
            payload: {
                sectionId: 'invited-1',
                items: [
                    { type: 'title', rowId: 'title-row-2' },
                    { type: 'title', rowId: 'title-row-1' },
                ],
            },
        })

        expect(nextState.entities.sections[0].rows[1]).toMatchObject({
            id: 'title-row-1',
            title: { id: 'title-1', title: 'Titlu 1' },
            person: { id: 'person-1', name: 'Ion', occupation: 'Reporter' },
        })
    })

    it('keeps title numbers consecutive after mixed reorder', () => {
        const state = stateWithSections([
            invitedSection({
                rows: [
                    { id: 'title-row-1', title: { id: 'title-1', nr: '10', title: 'Titlu 1' } },
                    { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
                    { id: 'title-row-2', title: { id: 'title-2', nr: '20', title: 'Titlu 2' } },
                    { id: 'title-row-3', title: { id: 'title-3', title: 'Titlu 3' } },
                ],
            }),
        ])

        const items: PlateauTitleListItem[] = [
            { type: 'title', rowId: 'title-row-3' },
            { type: 'divider', id: 'divider-1' },
            { type: 'title', rowId: 'title-row-1' },
            { type: 'title', rowId: 'title-row-2' },
        ]

        expect([...renumberPlateauTitles(items).values()]).toEqual([1, 2, 3])

        const nextState = csvReducer(state, {
            type: 'TITLE_LIST_REORDER',
            payload: { sectionId: 'invited-1', items },
        })

        expect(nextState.entities.sections[0].rows.flatMap((row) => row.title?.nr ?? [])).toEqual(['1', '2', '3'])
    })

    it('rejects reorder that would place two dividers consecutively', () => {
        const state = stateWithSections([
            invitedSection({
                rows: [
                    { id: 'title-row-1', title: { id: 'title-1', title: 'Titlu 1' } },
                    { id: 'divider-row-1', titleDivider: createTitleDivider('divider-1') },
                    { id: 'title-row-2', title: { id: 'title-2', title: 'Titlu 2' } },
                    { id: 'divider-row-2', titleDivider: createTitleDivider('divider-2') },
                    { id: 'title-row-3', title: { id: 'title-3', title: 'Titlu 3' } },
                ],
            }),
        ])

        const nextState = csvReducer(state, {
            type: 'TITLE_LIST_REORDER',
            payload: {
                sectionId: 'invited-1',
                items: [
                    { type: 'title', rowId: 'title-row-1' },
                    { type: 'divider', id: 'divider-1' },
                    { type: 'divider', id: 'divider-2' },
                    { type: 'title', rowId: 'title-row-2' },
                    { type: 'title', rowId: 'title-row-3' },
                ],
            },
        })

        expect(nextState).toBe(state)
    })
})
