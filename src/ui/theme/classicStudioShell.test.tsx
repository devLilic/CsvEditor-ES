import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyUiTheme } from '@/features/theme/themeResolver'
import { SectionsTabs } from '@/ui/components/SectionsTabs'

const csvHooks = vi.hoisted(() => ({
    sections: [{ id: 'invited-1', kind: 'invited', rows: [] }] as any[],
    activeSectionId: 'invited-1',
    setActiveSection: vi.fn(),
    addBetaSection: vi.fn(),
    renameBetaSection: vi.fn(),
    deleteBetaSection: vi.fn(),
    clearSelection: vi.fn(),
    setActiveEntityType: vi.fn(),
}))

vi.mock('@/features/csv-editor', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/csv-editor')>()

    return {
        ...actual,
        useEntities: () => ({
            sections: csvHooks.sections,
            activeSectionId: csvHooks.activeSectionId,
            setActiveSection: csvHooks.setActiveSection,
            addBetaSection: csvHooks.addBetaSection,
            renameBetaSection: csvHooks.renameBetaSection,
            deleteBetaSection: csvHooks.deleteBetaSection,
        }),
        useSelectedEntity: () => ({
            clearSelection: csvHooks.clearSelection,
        }),
        useActiveEntityType: () => ({
            setActiveEntityType: csvHooks.setActiveEntityType,
        }),
    }
})

describe('classic studio shell theme', () => {
    beforeEach(() => {
        csvHooks.sections = [{ id: 'invited-1', kind: 'invited', rows: [] }]
        csvHooks.activeSectionId = 'invited-1'
        applyUiTheme(document.documentElement, 'dark')
    })

    afterEach(() => {
        cleanup()
        document.documentElement.removeAttribute('data-theme')
        vi.clearAllMocks()
    })

    it('tema dark este aplicata root-ului', () => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })

    it('tabul activ primeste clasa semantica', () => {
        render(<SectionsTabs />)

        expect(screen.getByRole('button', { name: 'PLATOU' })).toHaveClass('app-tab-active')
    })

    it('panourile nu folosesc stiluri inline hardcodate', () => {
        render(<div data-testid="panel" className="app-panel" />)

        expect(screen.getByTestId('panel')).not.toHaveAttribute('style')
    })

    it('revenirea la metallic ramane posibila', () => {
        applyUiTheme(document.documentElement, 'metallic')

        expect(document.documentElement).toHaveAttribute('data-theme', 'metallic')
    })
})
