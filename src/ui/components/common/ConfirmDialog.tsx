// src/ui/components/common/ConfirmDialog.tsx
import { ReactNode, useState } from 'react'

export function ConfirmDialog({
    title,
    description,
    onConfirm,
    children,
    confirmLabel = 'Confirmă',
    cancelLabel = 'Anulează',
}: {
    title: string
    description?: string
    onConfirm: () => void
    children: ReactNode
    confirmLabel?: string
    cancelLabel?: string
}) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <span onClick={() => setOpen(true)}>
                {children}
            </span>

            {open && (
                <div className="app-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="app-modal w-80 rounded bg-white p-4">
                        <div className="app-modal-header">
                            <h2 className="mb-2 font-semibold">{title}</h2>
                        </div>
                        <div className="app-modal-body">
                            {description && (
                                <p className="mb-4 text-sm text-gray-600">
                                    {description}
                                </p>
                            )}
                        </div>
                        <div className="app-modal-footer flex justify-end gap-2">
                            <button className="app-button rounded border px-3 py-1" onClick={() => setOpen(false)}>
                                {cancelLabel}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm()
                                    setOpen(false)
                                }}
                                className="app-button app-button-danger rounded bg-red-600 px-3 py-1 text-white"
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
