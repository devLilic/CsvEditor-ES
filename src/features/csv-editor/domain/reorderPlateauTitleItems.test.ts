import { describe, expect, it } from 'vitest'
import type { PlateauTitleListItem } from './plateauTitleList'
import { reorderPlateauTitleItems } from './reorderPlateauTitleItems'

const title = (rowId: string): PlateauTitleListItem => ({ type: 'title', rowId })
const divider = (id: string): PlateauTitleListItem => ({ type: 'divider', id })

function ids(items: PlateauTitleListItem[]): string[] {
    return items.map((item) => item.type === 'title' ? item.rowId : item.id)
}

describe('reorderPlateauTitleItems', () => {
    it('moves a title up', () => {
        const first = title('title-1')
        const second = title('title-2')
        const third = title('title-3')

        const result = reorderPlateauTitleItems([first, second, third], 'title-3', 'title-1')

        expect(result).toEqual({ ok: true, items: [third, first, second] })
    })

    it('moves a title down', () => {
        const first = title('title-1')
        const second = title('title-2')
        const third = title('title-3')

        const result = reorderPlateauTitleItems([first, second, third], 'title-1', 'title-3')

        expect(result).toEqual({ ok: true, items: [second, third, first] })
    })

    it('moves a divider', () => {
        const items = [title('title-1'), divider('divider-1'), title('title-2'), title('title-3')]

        const result = reorderPlateauTitleItems(items, 'divider-1', 'title-3')

        expect(result.ok).toBe(true)
        expect(result.ok ? ids(result.items) : []).toEqual(['title-1', 'title-2', 'title-3', 'divider-1'])
    })

    it('moves a title over a divider', () => {
        const items = [title('title-1'), divider('divider-1'), title('title-2')]

        const result = reorderPlateauTitleItems(items, 'title-2', 'divider-1')

        expect(result.ok).toBe(true)
        expect(result.ok ? ids(result.items) : []).toEqual(['title-1', 'title-2', 'divider-1'])
    })

    it('moves a divider between two titles', () => {
        const items = [title('title-1'), title('title-2'), divider('divider-1'), title('title-3')]

        const result = reorderPlateauTitleItems(items, 'divider-1', 'title-2')

        expect(result.ok).toBe(true)
        expect(result.ok ? ids(result.items) : []).toEqual(['title-1', 'divider-1', 'title-2', 'title-3'])
    })

    it('refuses moving a divider next to another divider', () => {
        const items = [title('title-1'), divider('divider-1'), title('title-2'), divider('divider-2')]

        const result = reorderPlateauTitleItems(items, 'divider-2', 'divider-1')

        expect(result).toEqual({ ok: false, reason: 'consecutive-dividers' })
    })

    it('combines consecutive dividers created by moving a title', () => {
        const items = [
            title('title-1'),
            divider('divider-1'),
            title('title-2'),
            divider('divider-2'),
            title('title-3'),
        ]

        const result = reorderPlateauTitleItems(items, 'title-2', 'title-3')

        expect(result.ok).toBe(true)
        expect(result.ok ? ids(result.items) : []).toEqual([
            'title-1',
            'divider-1',
            'title-3',
            'title-2',
        ])
    })

    it('combines the two dividers left after moving T2 before D1', () => {
        const items = [
            title('title-1'),
            divider('divider-1'),
            title('title-2'),
            divider('divider-2'),
        ]

        const result = reorderPlateauTitleItems(items, 'title-2', 'divider-1')

        expect(result.ok).toBe(true)
        expect(result.ok ? ids(result.items) : []).toEqual([
            'title-1',
            'title-2',
            'divider-1',
        ])
    })

    it('keeps all items without duplicates', () => {
        const items = [title('title-1'), divider('divider-1'), title('title-2'), title('title-3')]

        const result = reorderPlateauTitleItems(items, 'title-3', 'title-1')

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(new Set(result.items)).toEqual(new Set(items))
        expect(result.items).toHaveLength(items.length)
    })

    it('returns a controlled result for invalid IDs', () => {
        const items = [title('title-1'), title('title-2')]

        expect(reorderPlateauTitleItems(items, 'missing', 'title-2')).toEqual({
            ok: false,
            reason: 'active-not-found',
        })
        expect(reorderPlateauTitleItems(items, 'title-1', 'missing')).toEqual({
            ok: false,
            reason: 'target-not-found',
        })
    })

    it('does not modify the input array', () => {
        const items = [title('title-1'), divider('divider-1'), title('title-2')]
        const snapshot = [...items]

        reorderPlateauTitleItems(items, 'title-2', 'title-1')

        expect(items).toEqual(snapshot)
    })
})
