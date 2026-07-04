import type { ReactNode } from 'react'

export type PlateauTitleDividerProps = {
    dividerId: string
    canDelete: boolean
    isDeleting?: boolean
    dragHandle?: ReactNode
    onDelete: (dividerId: string) => void
}

export function PlateauTitleDivider({
    dividerId,
    canDelete,
    isDeleting = false,
    dragHandle,
    onDelete,
}: PlateauTitleDividerProps) {
    return (
        <div
            className="group flex min-h-3 items-center gap-3 rounded bg-green-100 px-3 py-0.5"
            data-testid="plateau-title-divider"
        >
            {dragHandle && (
                <div className="ml-[5px] shrink-0">
                    {dragHandle}
                </div>
            )}

            <div
                role="separator"
                aria-orientation="horizontal"
                className="h-px flex-1 bg-green-500"
            />

            {canDelete && (
                <button
                    type="button"
                    aria-label="Sterge separatorul"
                    title="Sterge separatorul"
                    disabled={isDeleting}
                    onClick={(event) => {
                        event.stopPropagation()
                        onDelete(dividerId)
                    }}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-red-200 bg-white text-xs font-bold leading-none text-red-500 opacity-0 transition-opacity hover:border-red-400 hover:bg-red-50 hover:text-red-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span aria-hidden="true">x</span>
                </button>
            )}
        </div>
    )
}
