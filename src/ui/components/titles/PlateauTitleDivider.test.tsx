import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TITLE_DIVIDER_MARKER } from '@/features/csv-editor'
import { PlateauTitleDivider } from './PlateauTitleDivider'

afterEach(() => {
    cleanup()
})

describe('PlateauTitleDivider', () => {
    it('renders the visual divider element', () => {
        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete
                onDelete={vi.fn()}
            />
        )

        expect(screen.getByRole('separator')).toBeInTheDocument()
    })

    it('does not display the CSV marker text', () => {
        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete
                onDelete={vi.fn()}
            />
        )

        expect(screen.queryByText(TITLE_DIVIDER_MARKER)).not.toBeInTheDocument()
    })

    it('does not display a title number', () => {
        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete
                onDelete={vi.fn()}
            />
        )

        expect(screen.queryByText(/\d+\./)).not.toBeInTheDocument()
    })

    it('does not use title-card controls or editable title fields', () => {
        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete
                onDelete={vi.fn()}
            />
        )

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'ON AIR' })).not.toBeInTheDocument()
    })

    it('exposes an accessible delete button label', () => {
        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete
                onDelete={vi.fn()}
            />
        )

        expect(screen.getByRole('button', { name: 'Sterge separatorul' })).toBeInTheDocument()
    })

    it('deletes by divider id without bubbling the click', async () => {
        const user = userEvent.setup()
        const onDelete = vi.fn()
        const onParentClick = vi.fn()

        render(
            <div onClick={onParentClick}>
                <PlateauTitleDivider
                    dividerId="divider-1"
                    canDelete
                    onDelete={onDelete}
                />
            </div>
        )

        await user.click(screen.getByRole('button', { name: 'Sterge separatorul' }))

        expect(onDelete).toHaveBeenCalledWith('divider-1')
        expect(onParentClick).not.toHaveBeenCalled()
    })

    it('hides the delete control when delete is not allowed', () => {
        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete={false}
                onDelete={vi.fn()}
            />
        )

        expect(screen.queryByRole('button', { name: 'Sterge separatorul' })).not.toBeInTheDocument()
    })

    it('disables repeated delete clicks while deleting', async () => {
        const user = userEvent.setup()
        const onDelete = vi.fn()

        render(
            <PlateauTitleDivider
                dividerId="divider-1"
                canDelete
                isDeleting
                onDelete={onDelete}
            />
        )

        const button = screen.getByRole('button', { name: 'Sterge separatorul' })
        expect(button).toBeDisabled()

        await user.click(button)

        expect(onDelete).not.toHaveBeenCalled()
    })
})
