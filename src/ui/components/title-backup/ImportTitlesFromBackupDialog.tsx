import { useEffect, useMemo, useState } from 'react'
import type { TitleBackupListItem } from '@/features/title-backup/domain/titleBackupCsv'
import {
    titleBackupImportService,
    type TitleBackupImportReadResult,
} from '@/features/title-backup/services/titleBackupImportService'

type ImportTitlesFromBackupService = {
    listBackups(): Promise<{ ok: boolean; files: string[]; error?: string }>
    readBackup(filename: string): Promise<TitleBackupImportReadResult>
}

type ImportTitlesFromBackupDialogProps = {
    open: boolean
    onClose: () => void
    onImport: (items: TitleBackupListItem[]) => void | boolean | { ok: boolean; error?: string } | Promise<void | boolean | { ok: boolean; error?: string }>
    service?: ImportTitlesFromBackupService
}

function getTitleItemKey(filename: string, index: number): string {
    return `${filename}:${index}`
}

export function ImportTitlesFromBackupDialog({
    open,
    onClose,
    onImport,
    service = titleBackupImportService,
}: ImportTitlesFromBackupDialogProps) {
    const [files, setFiles] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState<string>('')
    const [backupResult, setBackupResult] = useState<TitleBackupImportReadResult | null>(null)
    const [selectedTitleKeys, setSelectedTitleKeys] = useState<Set<string>>(() => new Set())
    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return

        let isMounted = true

        setFiles([])
        setSelectedFile('')
        setBackupResult(null)
        setSelectedTitleKeys(new Set())
        setStatus(null)

        service.listBackups().then((result) => {
            if (!isMounted) return

            setFiles(result.files)
            if (!result.ok) {
                setStatus(result.error ?? 'Backupurile nu au putut fi incarcate.')
                return
            }

            const firstFile = result.files[0] ?? ''
            setSelectedFile(firstFile)
        })

        return () => {
            isMounted = false
        }
    }, [open, service])

    useEffect(() => {
        if (!open || !selectedFile) return

        let isMounted = true

        setBackupResult(null)
        setSelectedTitleKeys(new Set())
        setStatus(null)

        service.readBackup(selectedFile).then((result) => {
            if (!isMounted) return

            setBackupResult(result)
            if (!result.valid) {
                setStatus(result.errors.join('\n') || 'Fisierul backup este invalid.')
            }
        })

        return () => {
            isMounted = false
        }
    }, [open, selectedFile, service])

    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, open])

    const selectedItems = useMemo(() => {
        if (!backupResult) return []

        return backupResult.items.filter((item, index) =>
            item.type === 'title' &&
            selectedTitleKeys.has(getTitleItemKey(backupResult.filename, index))
        )
    }, [backupResult, selectedTitleKeys])

    if (!open) {
        return null
    }

    const toggleTitle = (key: string) => {
        setSelectedTitleKeys((current) => {
            const next = new Set(current)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const handleImport = async () => {
        if (selectedItems.length === 0) return

        const result = await onImport(selectedItems)
        if (result === false || (result && typeof result === 'object' && 'ok' in result && !result.ok)) {
            setStatus(
                result && typeof result === 'object' && 'error' in result
                    ? result.error ?? 'Importul nu a putut fi finalizat.'
                    : 'Importul nu a putut fi finalizat.'
            )
            return
        }

        onClose()
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="title-backup-import-title"
            className="app-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
            <div className="app-modal flex max-h-[85vh] w-full max-w-4xl flex-col rounded bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between gap-4">
                    <h2 id="title-backup-import-title" className="text-lg font-semibold text-gray-900">
                        Import titluri din backup
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="app-button rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                </div>

                {status && (
                    <div role="alert" className="app-notification app-notification-danger mt-4 whitespace-pre-line rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        {status}
                    </div>
                )}

                <div className="mt-5 grid min-h-0 flex-1 grid-cols-[minmax(180px,260px)_1fr] gap-4">
                    <div className="app-panel min-h-0 overflow-y-auto rounded border border-gray-200">
                        {files.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-gray-600">Nu exista backupuri de titluri.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {files.map((filename) => (
                                    <li key={filename}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(filename)}
                                            className={`w-full px-3 py-2 text-left text-sm ${
                                                filename === selectedFile
                                                    ? 'app-list-row-active bg-blue-50 font-semibold text-blue-800'
                                                    : 'text-gray-800 hover:bg-gray-50'
                                            }`}
                                        >
                                            {filename}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="app-panel min-h-0 overflow-y-auto rounded border border-gray-200 p-3">
                        {!backupResult ? (
                            <p className="text-sm text-gray-600">Selecteaza un backup.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {backupResult.items.map((item, index) => {
                                    if (item.type === 'divider') {
                                        return (
                                            <div
                                                key={`${backupResult.filename}:divider:${index}`}
                                                data-testid="backup-title-divider"
                                                className="app-divider-row flex min-h-4 items-center rounded bg-green-50 px-3"
                                            >
                                                <div
                                                    role="separator"
                                                    aria-orientation="horizontal"
                                                    className="app-divider-line h-px flex-1 bg-green-500"
                                                />
                                            </div>
                                        )
                                    }

                                    const key = getTitleItemKey(backupResult.filename, index)

                                    return (
                                        <label
                                            key={key}
                                            className="app-list-row flex cursor-pointer items-center gap-3 rounded border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTitleKeys.has(key)}
                                                onChange={() => toggleTitle(key)}
                                            />
                                            <span>{item.title}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="app-button rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleImport}
                        disabled={selectedItems.length === 0}
                        className="app-button app-button-primary rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Import
                    </button>
                </div>
            </div>
        </div>
    )
}
