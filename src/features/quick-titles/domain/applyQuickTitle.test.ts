import { describe, expect, it } from 'vitest'
import { applyQuickTitle, type ApplyQuickTitleInput } from './applyQuickTitle'

describe('applyQuickTitle', () => {
    it('activates a QuickTitle and replaces the current leading prefix', () => {
        expect(applyQuickTitle({
            editorValue: 'DIRECTOR: sedinta de guvern',
            selectedQuickTitle: 'PRESEDINTE',
            activeQuickTitle: null,
        })).toEqual({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            activeQuickTitle: 'PRESEDINTE: ',
            toggledOn: true,
        })
    })

    it('deactivates the active QuickTitle and preserves the title body', () => {
        expect(applyQuickTitle({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: 'PRESEDINTE',
            activeQuickTitle: 'PRESEDINTE: ',
        })).toEqual({
            editorValue: 'sedinta de guvern',
            activeQuickTitle: null,
            toggledOn: false,
        })
    })

    it('leaves an empty editor when deactivating a prefix without a body', () => {
        expect(applyQuickTitle({
            editorValue: 'PRESEDINTE: ',
            selectedQuickTitle: 'PRESEDINTE',
            activeQuickTitle: 'PRESEDINTE: ',
        })).toEqual({
            editorValue: '',
            activeQuickTitle: null,
            toggledOn: false,
        })
    })

    it('compares active QuickTitles using normalized values', () => {
        expect(applyQuickTitle({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: ' PRESEDINTE:   ',
            activeQuickTitle: 'PRESEDINTE',
        })).toEqual({
            editorValue: 'sedinta de guvern',
            activeQuickTitle: null,
            toggledOn: false,
        })
    })

    it('activates another QuickTitle and preserves the title body', () => {
        expect(applyQuickTitle({
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: 'DIRECTOR',
            activeQuickTitle: 'PRESEDINTE: ',
        })).toEqual({
            editorValue: 'DIRECTOR: sedinta de guvern',
            activeQuickTitle: 'DIRECTOR: ',
            toggledOn: true,
        })
    })

    it('does not remove editor text when an inconsistent active prefix is toggled off', () => {
        expect(applyQuickTitle({
            editorValue: 'sedinta de guvern',
            selectedQuickTitle: 'PRESEDINTE',
            activeQuickTitle: 'PRESEDINTE: ',
        })).toEqual({
            editorValue: 'sedinta de guvern',
            activeQuickTitle: null,
            toggledOn: false,
        })
    })

    it('does not mutate the input', () => {
        const input: ApplyQuickTitleInput = {
            editorValue: 'PRESEDINTE: sedinta de guvern',
            selectedQuickTitle: 'DIRECTOR',
            activeQuickTitle: 'PRESEDINTE: ',
        }
        const snapshot = { ...input }

        applyQuickTitle(input)

        expect(input).toEqual(snapshot)
    })
})
