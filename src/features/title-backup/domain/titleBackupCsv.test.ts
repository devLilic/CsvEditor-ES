import { describe, expect, it } from 'vitest'
import {
    parseTitleBackup,
    serializeTitleBackup,
    type TitleBackupListItem,
} from './titleBackupCsv'

describe('title backup csv', () => {
    it('does not write a header', () => {
        expect(serializeTitleBackup([
            { type: 'title', title: 'Primul titlu' },
        ])).toBe('Primul titlu')
    })

    it('does not write Nr', () => {
        expect(serializeTitleBackup([
            { type: 'title', title: 'Primul titlu' },
        ])).not.toContain('Nr')
    })

    it('serializes titles', () => {
        expect(serializeTitleBackup([
            { type: 'title', title: 'Primul titlu' },
            { type: 'title', title: 'Al doilea titlu' },
        ])).toBe('Primul titlu\nAl doilea titlu')
    })

    it('serializes divider', () => {
        expect(serializeTitleBackup([
            { type: 'divider' },
        ])).toBe('[ DIVIDER ]')
    })

    it('keeps the order', () => {
        expect(serializeTitleBackup([
            { type: 'title', title: 'Primul titlu' },
            { type: 'divider' },
            { type: 'title', title: 'Al doilea titlu' },
        ])).toBe('Primul titlu\n[ DIVIDER ]\nAl doilea titlu')
    })

    it('parses titles', () => {
        expect(parseTitleBackup('Primul titlu\nAl doilea titlu')).toEqual({
            items: [
                { type: 'title', title: 'Primul titlu' },
                { type: 'title', title: 'Al doilea titlu' },
            ],
            valid: true,
            errors: [],
        })
    })

    it('parses dividers', () => {
        expect(parseTitleBackup('Primul titlu\n[ DIVIDER ]\nAl doilea titlu').items).toEqual([
            { type: 'title', title: 'Primul titlu' },
            { type: 'divider' },
            { type: 'title', title: 'Al doilea titlu' },
        ])
    })

    it('round-trips the structure', () => {
        const items: TitleBackupListItem[] = [
            { type: 'title', title: 'Primul titlu' },
            { type: 'divider' },
            { type: 'title', title: 'Al doilea titlu' },
        ]

        expect(parseTitleBackup(serializeTitleBackup(items))).toEqual({
            items,
            valid: true,
            errors: [],
        })
    })

    it('ignores empty rows', () => {
        expect(parseTitleBackup('\nPrimul titlu\n\n[ DIVIDER ]\n\n').items).toEqual([
            { type: 'title', title: 'Primul titlu' },
            { type: 'divider' },
        ])
    })

    it('detects consecutive dividers in an invalid file', () => {
        const result = parseTitleBackup('Primul titlu\n[ DIVIDER ]\n[ DIVIDER ]\nAl doilea titlu')

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Row 3 has a consecutive divider.')
        expect(result.items).toEqual([
            { type: 'title', title: 'Primul titlu' },
            { type: 'divider' },
            { type: 'divider' },
            { type: 'title', title: 'Al doilea titlu' },
        ])
    })
})
