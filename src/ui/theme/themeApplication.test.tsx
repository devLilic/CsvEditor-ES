import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@/styles/index.css'
import { applyUiTheme } from '@/features/theme/themeResolver'
import { BackupFailedDialog } from '@/ui/components/csv/BackupFailedDialog'
import { PlateauTitleDivider } from '@/ui/components/titles/PlateauTitleDivider'

const themeCss = readFileSync(join(process.cwd(), 'src/styles/index.css'), 'utf8')

afterEach(() => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
})

describe('theme application', () => {
    it('root primeste data-theme=legacy', () => {
        applyUiTheme(document.documentElement, 'legacy')

        expect(document.documentElement).toHaveAttribute('data-theme', 'legacy')
    })

    it('root primeste data-theme=metallic', () => {
        applyUiTheme(document.documentElement, 'metallic')

        expect(document.documentElement).toHaveAttribute('data-theme', 'metallic')
    })

    it('schimbarea temei actualizeaza atributul', () => {
        applyUiTheme(document.documentElement, 'legacy')
        applyUiTheme(document.documentElement, 'metallic')

        expect(document.documentElement).toHaveAttribute('data-theme', 'metallic')
    })

    it('modalurile mostenesc tema', () => {
        applyUiTheme(document.documentElement, 'metallic')

        render(
            <BackupFailedDialog
                open
                error="Backup failed"
                onCancel={vi.fn()}
                onContinueWithoutBackup={vi.fn()}
            />
        )

        expect(document.documentElement).toHaveAttribute('data-theme', 'metallic')
        expect(screen.getByRole('dialog')).toHaveClass('app-modal-overlay')
        expect(screen.getByRole('heading', { name: 'Backup CSV nu a putut fi creat.' }).parentElement)
            .toHaveClass('app-modal')
    })

    it('dividerul foloseste tokenii temei', () => {
        applyUiTheme(document.documentElement, 'metallic')

        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete
                onDelete={vi.fn()}
            />
        )

        expect(screen.getByTestId('plateau-title-divider')).toHaveClass('app-divider-row')
        expect(screen.getByRole('separator')).toHaveClass('app-divider-line')
        expect(themeCss).toContain('background: var(--divider-color)')
    })

    it('duplicate highlight foloseste tokenii temei', () => {
        applyUiTheme(document.documentElement, 'metallic')

        render(
            <div
                data-testid="duplicate-row"
                className="app-list-row bg-[var(--duplicate-title-bg)] border-l-[var(--duplicate-title-border)] text-[var(--duplicate-title-text)]"
            />
        )

        const duplicateRow = screen.getByTestId('duplicate-row')
        expect(duplicateRow).toHaveClass('bg-[var(--duplicate-title-bg)]')
        expect(duplicateRow).toHaveClass('border-l-[var(--duplicate-title-border)]')
        expect(duplicateRow).toHaveClass('text-[var(--duplicate-title-text)]')
        expect(themeCss).toContain('background: var(--duplicate-title-bg)')
        expect(themeCss).toContain('border-left-color: var(--duplicate-title-border)')
    })

    it('revenirea la legacy functioneaza', () => {
        applyUiTheme(document.documentElement, 'metallic')
        applyUiTheme(document.documentElement, 'legacy')

        expect(document.documentElement).toHaveAttribute('data-theme', 'legacy')
    })
})
