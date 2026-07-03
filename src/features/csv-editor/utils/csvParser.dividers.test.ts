import { describe, expect, it } from 'vitest'
import { TITLE_DIVIDER_MARKER } from '../domain/plateauTitleList'
import { parseCsv } from './csvParser'

const header = 'Nr;Titlu;Nume;Functie;Image;Locatie;Ultima Ora;Titlu Asteptare;Locatie Asteptare'

describe('parseCsv PLATOU title dividers', () => {
    it('parses a divider between two invited titles and preserves its position', () => {
        const result = parseCsv([
            header,
            ';--- INVITATI ---;;;;;;;',
            '1;Primul titlu;;;;;;;',
            `;${TITLE_DIVIDER_MARKER};;;;;;;`,
            '2;Al doilea titlu;;;;;;;',
        ].join('\n'))

        const rows = result.sections[0].rows

        expect(rows).toHaveLength(3)
        expect(rows[0].title?.title).toBe('Primul titlu')
        expect(rows[1].titleDivider).toMatchObject({ type: 'divider' })
        expect(rows[2].title?.title).toBe('Al doilea titlu')
    })

    it('parses multiple dividers in the invited title order', () => {
        const result = parseCsv([
            header,
            ';--- INVITATI ---;;;;;;;',
            `;${TITLE_DIVIDER_MARKER};;;;;;;`,
            '1;Primul titlu;;;;;;;',
            `;${TITLE_DIVIDER_MARKER};;;;;;;`,
            '2;Al doilea titlu;;;;;;;',
            `;${TITLE_DIVIDER_MARKER};;;;;;;`,
        ].join('\n'))

        const rows = result.sections[0].rows

        expect(rows.map((row) => row.titleDivider ? 'divider' : row.title?.title)).toEqual([
            'divider',
            'Primul titlu',
            'divider',
            'Al doilea titlu',
            'divider',
        ])
    })

    it('does not assign a title number or title entity to divider rows', () => {
        const result = parseCsv([
            header,
            ';--- INVITATI ---;;;;;;;',
            `;${TITLE_DIVIDER_MARKER};;;;;;;`,
        ].join('\n'))

        const dividerRow = result.sections[0].rows[0]

        expect(dividerRow.titleDivider).toMatchObject({ type: 'divider' })
        expect(dividerRow.title).toBeUndefined()
    })

    it('does not import dividers from beta sections', () => {
        const result = parseCsv([
            header,
            ';--- beta 1 - Externe ---;;;;;;;',
            `;${TITLE_DIVIDER_MARKER};;;;;;;`,
            '1;Titlu beta;;;;;;;',
            ';--- INVITATI ---;;;;;;;',
            '1;Titlu platou;;;;;;;',
        ].join('\n'))

        const betaRows = result.sections[0].rows
        const invitedRows = result.sections[1].rows

        expect(betaRows).toHaveLength(1)
        expect(betaRows[0].title?.title).toBe('Titlu beta')
        expect(betaRows[0].titleDivider).toBeUndefined()
        expect(invitedRows).toHaveLength(1)
        expect(invitedRows[0].title?.title).toBe('Titlu platou')
    })

    it('keeps old CSV files without dividers compatible', () => {
        const result = parseCsv([
            header,
            '1;Primul titlu;Ion Popescu;Reporter;;Chisinau;Urgent;Asteptare;Studio',
            '2;Al doilea titlu;;;;;;;',
        ].join('\n'))

        expect(result.sections).toHaveLength(1)
        expect(result.sections[0].kind).toBe('invited')
        expect(result.sections[0].rows).toHaveLength(2)
        expect(result.sections[0].rows.map((row) => row.title?.title)).toEqual([
            'Primul titlu',
            'Al doilea titlu',
        ])
        expect(result.sections[0].rows.some((row) => row.titleDivider)).toBe(false)
    })
})
