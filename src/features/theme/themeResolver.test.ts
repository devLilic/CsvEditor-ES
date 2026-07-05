import { describe, expect, it } from 'vitest'
import { applyUiTheme, resolveUiTheme } from './themeResolver'

describe('themeResolver', () => {
    it('accepta legacy', () => {
        expect(resolveUiTheme('legacy')).toBe('legacy')
    })

    it('accepta metallic', () => {
        expect(resolveUiTheme('metallic')).toBe('metallic')
    })

    it('accepta dark', () => {
        expect(resolveUiTheme('dark')).toBe('dark')
    })

    it('revine la legacy pentru valoare invalida', () => {
        expect(resolveUiTheme('unknown')).toBe('legacy')
    })

    it('aplica atributul corect', () => {
        const element = document.createElement('div')

        applyUiTheme(element, 'metallic')

        expect(element).toHaveAttribute('data-theme', 'metallic')
    })

    it('default sigur este legacy', () => {
        expect(resolveUiTheme()).toBe('legacy')
    })
})
