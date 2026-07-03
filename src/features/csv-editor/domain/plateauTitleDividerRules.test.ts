import { describe, expect, it } from 'vitest'
import type { PlateauTitleListItem } from './plateauTitleList'
import { canInsertDividerAt } from './plateauTitleList'

const title = (rowId: string): PlateauTitleListItem => ({ type: 'title', rowId })
const divider = (id: string): PlateauTitleListItem => ({ type: 'divider', id })

describe('plateau title divider insertion rules', () => {
    it('allows a divider between two titles', () => {
        expect(canInsertDividerAt([title('title-1'), title('title-2')], 1)).toBe(true)
    })

    it('refuses insertion immediately before a divider', () => {
        expect(canInsertDividerAt([title('title-1'), divider('divider-1'), title('title-2')], 1)).toBe(false)
    })

    it('refuses insertion immediately after a divider', () => {
        expect(canInsertDividerAt([title('title-1'), divider('divider-1'), title('title-2')], 2)).toBe(false)
    })

    it('refuses insertion between two existing dividers', () => {
        expect(canInsertDividerAt([title('title-1'), divider('divider-1'), divider('divider-2'), title('title-2')], 2)).toBe(false)
    })

    it('allows insertion at the beginning when the first item is a title', () => {
        expect(canInsertDividerAt([title('title-1'), title('title-2')], 0)).toBe(true)
    })

    it('refuses insertion at the beginning when the first item is a divider', () => {
        expect(canInsertDividerAt([divider('divider-1'), title('title-1')], 0)).toBe(false)
    })

    it('allows insertion at the end when the last item is a title', () => {
        expect(canInsertDividerAt([title('title-1'), title('title-2')], 2)).toBe(true)
    })

    it('refuses insertion at the end when the last item is a divider', () => {
        expect(canInsertDividerAt([title('title-1'), divider('divider-1')], 2)).toBe(false)
    })

    it('returns false for invalid indexes', () => {
        const items = [title('title-1'), title('title-2')]

        expect(canInsertDividerAt(items, -1)).toBe(false)
        expect(canInsertDividerAt(items, 3)).toBe(false)
        expect(canInsertDividerAt(items, 0.5)).toBe(false)
    })

    it('does not modify the input', () => {
        const items = [title('title-1'), divider('divider-1'), title('title-2')]
        const snapshot = structuredClone(items)

        canInsertDividerAt(items, 1)

        expect(items).toEqual(snapshot)
    })
})
