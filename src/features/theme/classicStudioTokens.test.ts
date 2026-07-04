import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveUiTheme } from './themeResolver'

const themeCss = readFileSync(join(process.cwd(), 'src/styles/index.css'), 'utf8')

const requiredTokens = [
    '--app-bg',
    '--workspace-bg',
    '--panel-bg',
    '--panel-bg-muted',
    '--panel-bg-elevated',
    '--panel-border',
    '--panel-border-strong',
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--text-inverse',
    '--accent',
    '--accent-hover',
    '--accent-active',
    '--accent-soft',
    '--button-primary-bg',
    '--button-primary-hover',
    '--button-primary-text',
    '--button-secondary-bg',
    '--button-secondary-hover',
    '--button-secondary-text',
    '--button-danger-bg',
    '--button-danger-hover',
    '--input-bg',
    '--input-border',
    '--input-border-hover',
    '--input-border-focus',
    '--input-placeholder',
    '--focus-ring',
    '--tab-bg',
    '--tab-hover-bg',
    '--tab-active-bg',
    '--tab-active-border',
    '--tab-active-text',
    '--list-row-bg',
    '--list-row-hover-bg',
    '--list-row-selected-bg',
    '--list-row-border',
    '--modal-bg',
    '--modal-overlay',
    '--modal-border',
    '--modal-shadow',
    '--divider-color',
    '--divider-hover',
    '--drag-handle',
    '--duplicate-title-bg',
    '--duplicate-title-border',
    '--duplicate-title-text',
    '--success',
    '--warning',
    '--danger',
    '--info',
    '--radius-sm',
    '--radius-md',
    '--radius-lg',
    '--shadow-sm',
    '--shadow-md',
    '--shadow-lg',
    '--space-xs',
    '--space-sm',
    '--space-md',
    '--space-lg',
    '--space-xl',
]

function getThemeBlock(theme: 'legacy' | 'metallic' | 'dark'): string {
    const match = themeCss.match(new RegExp(`:root\\[data-theme='${theme}'\\]\\s*\\{([\\s\\S]*?)\\n\\}`))
    return match?.[1] ?? ''
}

function getToken(block: string, token: string): string | undefined {
    const match = block.match(new RegExp(`${token}:\\s*([^;]+);`))
    return match?.[1]?.trim()
}

describe('classic studio tokens', () => {
    const legacyBlock = getThemeBlock('legacy')
    const darkBlock = getThemeBlock('dark')
    const metallicBlock = getThemeBlock('metallic')

    it('tema dark defineste tokenii obligatorii', () => {
        expect(darkBlock).not.toBe('')

        for (const token of requiredTokens) {
            expect(getToken(darkBlock, token), token).toBeTruthy()
        }
    })

    it('tokenii pentru duplicate exista', () => {
        expect(getToken(darkBlock, '--duplicate-title-bg')).toBeTruthy()
        expect(getToken(darkBlock, '--duplicate-title-border')).toBeTruthy()
        expect(getToken(darkBlock, '--duplicate-title-text')).toBeTruthy()
    })

    it('tokenii pentru divider exista', () => {
        expect(getToken(darkBlock, '--divider-color')).toBeTruthy()
        expect(getToken(darkBlock, '--divider-hover')).toBeTruthy()
    })

    it('tokenii pentru focus exista', () => {
        expect(getToken(darkBlock, '--focus-ring')).toBeTruthy()
        expect(getToken(darkBlock, '--input-border-focus')).toBeTruthy()
    })

    it('metallic ramane separat', () => {
        expect(metallicBlock).not.toBe('')
        expect(getToken(metallicBlock, '--app-bg')).toBeTruthy()
        expect(getToken(metallicBlock, '--app-bg')).not.toBe(getToken(darkBlock, '--app-bg'))
        expect(getToken(metallicBlock, '--accent')).not.toBe(getToken(darkBlock, '--accent'))
    })

    it('legacy ramane tema clasica separata', () => {
        expect(legacyBlock).not.toBe('')
        expect(getToken(legacyBlock, '--app-bg')).not.toBe(getToken(darkBlock, '--app-bg'))
        expect(getToken(legacyBlock, '--accent')).not.toBe(getToken(darkBlock, '--accent'))
    })

    it('fallback-ul ramane legacy', () => {
        expect(resolveUiTheme()).toBe('legacy')
        expect(resolveUiTheme('unknown')).toBe('legacy')
    })
})
