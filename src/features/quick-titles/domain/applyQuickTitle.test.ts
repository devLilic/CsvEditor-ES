import { describe, expect, it } from 'vitest'
import { applyQuickTitle, type ApplyQuickTitleInput } from './applyQuickTitle'

describe('applyQuickTitle', () => {
    it('keeps the current behavior on first click', () => {
        expect(applyQuickTitle({
            editorValue: 'DIRECTOR: sedinta de guvern',
            selectedQuickTitle: 'PRESEDINTE',
            lastUsedQuickTitle: null,
        })).toEqual({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            lastUsedQuickTitle: 'PRESEDINTE: ',
            repeated: false,
        })
    })

    it('remembers the selected QuickTitle', () => {
        const result = applyQuickTitle({
            editorValue: 'sedinta de guvern',
            selectedQuickTitle: 'PRESEDINTE',
            lastUsedQuickTitle: null,
        })

        expect(result.lastUsedQuickTitle).toBe('PRESEDINTE: ')
    })

    it('resets the editor on repeated click', () => {
        expect(applyQuickTitle({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: 'PRESEDINTE',
            lastUsedQuickTitle: 'PRESEDINTE: ',
        })).toEqual({
            editorValue: 'PRESEDINTE: ',
            lastUsedQuickTitle: 'PRESEDINTE: ',
            repeated: true,
        })
    })

    it('compares QuickTitles using normalized values', () => {
        expect(applyQuickTitle({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: ' PRESEDINTE:   ',
            lastUsedQuickTitle: 'PRESEDINTE',
        })).toEqual({
            editorValue: 'PRESEDINTE: ',
            lastUsedQuickTitle: 'PRESEDINTE: ',
            repeated: true,
        })
    })

    it('does not reset when another QuickTitle is selected', () => {
        expect(applyQuickTitle({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: 'DIRECTOR',
            lastUsedQuickTitle: 'PRESEDINTE: ',
        })).toEqual({
            editorValue: 'DIRECTOR: sedinta de guvern',
            lastUsedQuickTitle: 'DIRECTOR: ',
            repeated: false,
        })
    })

    it('does not mutate the input', () => {
        const input: ApplyQuickTitleInput = {
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: 'DIRECTOR',
            lastUsedQuickTitle: 'PRESEDINTE: ',
        }
        const snapshot = { ...input }

        applyQuickTitle(input)

        expect(input).toEqual(snapshot)
    })
})
