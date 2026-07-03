import { describe, expect, it } from 'vitest'
import {
    TITLE_DIVIDER_MARKER,
    createTitleDivider,
    getOrderedTitleIds,
    isTitleDividerMarker,
    renumberPlateauTitles,
    type PlateauTitleListItem,
} from './plateauTitleList'

describe('plateau title list domain model', () => {
    it('recognizes only the exact divider marker', () => {
        expect(TITLE_DIVIDER_MARKER).toBe('[ DIVIDER ]')
        expect(isTitleDividerMarker('[ DIVIDER ]')).toBe(true)
        expect(isTitleDividerMarker('[DIVIDER]')).toBe(false)
        expect(isTitleDividerMarker(' [ DIVIDER ] ')).toBe(false)
        expect(isTitleDividerMarker('[ divider ]')).toBe(false)
        expect(isTitleDividerMarker('Titlu normal')).toBe(false)
    })

    it('creates a divider item without editable title data', () => {
        expect(createTitleDivider('divider-1')).toEqual({
            type: 'divider',
            id: 'divider-1',
        })
    })

    it('returns ordered title ids while preserving divider positions in the input model', () => {
        const items: PlateauTitleListItem[] = [
            { type: 'title', rowId: 'title-1' },
            createTitleDivider('divider-1'),
            { type: 'title', rowId: 'title-2' },
            createTitleDivider('divider-2'),
            { type: 'title', rowId: 'title-3' },
        ]

        expect(getOrderedTitleIds(items)).toEqual(['title-1', 'title-2', 'title-3'])
        expect(items).toEqual([
            { type: 'title', rowId: 'title-1' },
            { type: 'divider', id: 'divider-1' },
            { type: 'title', rowId: 'title-2' },
            { type: 'divider', id: 'divider-2' },
            { type: 'title', rowId: 'title-3' },
        ])
    })

    it('assigns consecutive numbers only to title items', () => {
        const numbers = renumberPlateauTitles([
            createTitleDivider('divider-before'),
            { type: 'title', rowId: 'title-a' },
            createTitleDivider('divider-middle'),
            { type: 'title', rowId: 'title-b' },
            { type: 'title', rowId: 'title-c' },
            createTitleDivider('divider-after'),
        ])

        expect([...numbers.entries()]).toEqual([
            ['title-a', 1],
            ['title-b', 2],
            ['title-c', 3],
        ])
        expect(numbers.has('divider-before')).toBe(false)
        expect(numbers.has('divider-middle')).toBe(false)
        expect(numbers.has('divider-after')).toBe(false)
    })
})
