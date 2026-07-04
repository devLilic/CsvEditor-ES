import { describe, expect, it } from 'vitest'
import { findDuplicateTitleIds, normalizeTitleForDuplicateCheck } from './findDuplicateTitles'

describe('findDuplicateTitles', () => {
    it('returns no duplicates when titles are unique', () => {
        const duplicates = findDuplicateTitleIds([
            { id: 'title-1', title: 'ECONOMIE' },
            { id: 'title-2', title: 'SPORT' },
            { id: 'title-3', title: 'METEO' },
        ])

        expect([...duplicates]).toEqual([])
    })

    it('finds two duplicate titles', () => {
        const duplicates = findDuplicateTitleIds([
            { id: 'title-1', title: 'ECONOMIE' },
            { id: 'title-2', title: 'SPORT' },
            { id: 'title-3', title: 'ECONOMIE' },
            { id: 'title-4', title: 'METEO' },
        ])

        expect([...duplicates]).toEqual(['title-1', 'title-3'])
    })

    it('marks both duplicate occurrences', () => {
        const duplicates = findDuplicateTitleIds([
            { id: 'title-1', title: 'ECONOMIE' },
            { id: 'title-2', title: 'economie' },
        ])

        expect(duplicates.has('title-1')).toBe(true)
        expect(duplicates.has('title-2')).toBe(true)
    })

    it('marks three duplicate occurrences', () => {
        const duplicates = findDuplicateTitleIds([
            { id: 'title-1', title: 'ECONOMIE' },
            { id: 'title-2', title: 'economie' },
            { id: 'title-3', title: 'ECONOMIE ' },
        ])

        expect([...duplicates]).toEqual(['title-1', 'title-2', 'title-3'])
    })

    it('normalizes titles by trimming whitespace', () => {
        expect(normalizeTitleForDuplicateCheck(' ECONOMIE ')).toBe('economie')

        const duplicates = findDuplicateTitleIds([
            { id: 'title-1', title: 'ECONOMIE' },
            { id: 'title-2', title: 'ECONOMIE ' },
        ])

        expect([...duplicates]).toEqual(['title-1', 'title-2'])
    })

    it('normalizes titles case-insensitively', () => {
        expect(normalizeTitleForDuplicateCheck('ECONOMIE')).toBe('economie')

        const duplicates = findDuplicateTitleIds([
            { id: 'title-1', title: 'ECONOMIE' },
            { id: 'title-2', title: 'economie' },
        ])

        expect([...duplicates]).toEqual(['title-1', 'title-2'])
    })

    it('ignores empty titles', () => {
        const duplicates = findDuplicateTitleIds([
            { id: 'title-1', title: '' },
            { id: 'title-2', title: ' ' },
            { id: 'title-3', title: 'ECONOMIE' },
        ])

        expect([...duplicates]).toEqual([])
    })

    it('does not modify the input', () => {
        const titles = [
            { id: 'title-1', title: 'ECONOMIE ' },
            { id: 'title-2', title: 'economie' },
        ]
        const snapshot = titles.map((title) => ({ ...title }))

        findDuplicateTitleIds(titles)

        expect(titles).toEqual(snapshot)
    })
})
