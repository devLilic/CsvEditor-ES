// src/ui/components/EntityEditor.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
    FALLBACK_PHONE_IMAGE_SETTINGS,
    buildSuggestedPhoneImageFilename,
    getPhoneImageDisplayFilename,
    type PhoneImageSettings,
    getCsvEntityTypeForEditorView,
    type EntityType,
    useEntities,
    useSelectedEntity,
    useActiveEntityType,
    useQuickTitles,
} from '@/features/csv-editor'
import { phoneImageSettingsService } from '@/features/csv-editor/services/phoneImageSettingsService'
import { applyQuickTitle as applyQuickTitleToEditor } from '@/features/quick-titles/domain/applyQuickTitle'
import { buildPersonQuickTitleSuggestion } from '@/features/quick-titles/domain/personQuickTitleSuggestion'
import { normalizeAndDeduplicateQuickTitles } from '@/features/quick-titles/domain/quickTitle'
import {
    type EditableTemplateEntityType,
    useTemplateDocument,
} from '@/features/template-editor/state/TemplateDocumentProvider'
import { createPreviewData } from '@/templates/broadcast'
import { Preview16x9 } from './Preview16x9'
import { QuickTitlesBar } from './QuickTitlesBar'
import { InputField } from './common/InputField'
import { PhoneImageModal } from './phone-image/PhoneImageModal'
import { PersonQuickTitleDialog } from './quick-titles/PersonQuickTitleDialog'
import { showErrorToast } from './common/toast'
import { ImportTitlesFromBackupDialog } from './title-backup/ImportTitlesFromBackupDialog'

type FormState = {
    title?: string
    name?: string
    occupation?: string
    location?: string
    image?: string
}

function getTemplateKeyForViewType(entityType: EntityType): EditableTemplateEntityType {
    return entityType
}

function isEntityTypeAllowedInSection(entityType: EntityType, sectionKind?: string) {
    return sectionKind !== 'beta' || entityType === 'titles' || entityType === 'persons'
}

function DividerButtonIcon() {
    return (
        <span className="relative block h-7 w-9" aria-hidden="true">
            <span className="absolute left-0 top-1 h-5 w-3 rounded-l-md border-y-[5px] border-l-[5px] border-gray-800" />
            <span className="absolute right-0 top-1 h-5 w-3 rounded-r-md border-y-[5px] border-r-[5px] border-gray-800" />
            <span className="absolute left-1/2 top-0 h-7 w-1.5 -translate-x-1/2 rounded-full bg-gray-800" />
        </span>
    )
}

function ArchiveImportIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 32 28"
            className="block h-7 w-8"
            fill="none"
        >
            <path
                d="M2 9.5h10.5l2.5 3H30v12H2v-15Z"
                fill="#111827"
            />
            <path
                d="M2 8h10.5l2.5 3H30v3H2V8Z"
                fill="#111827"
            />
            <path
                d="M16 2h5v11h4l-6.5 7L12 13h4V2Z"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export function EntityEditor() {
    const {
        activeSectionId,
        activeSection,
        getBlockItems,
        addEntity,
        updateEntity,
        savePersonEntity,
        addPlateauTitleDivider,
        importPlateauTitlesFromBackup,
    } = useEntities()

    const { selected, clearSelection } = useSelectedEntity()
    const { activeEntityType, setActiveEntityType } = useActiveEntityType()
    const { quickTitles, setAllQuickTitles } = useQuickTitles()
    const { document: templateDocument } = useTemplateDocument()
    const editorEntityType = getCsvEntityTypeForEditorView(activeEntityType)
    const isAllowedInActiveSection = isEntityTypeAllowedInSection(activeEntityType, activeSection?.kind)

    const [showInvalid, setShowInvalid] = useState(false)
    const [form, setForm] = useState<FormState>({})
    const [phoneImageSettings, setPhoneImageSettings] = useState<PhoneImageSettings>(FALLBACK_PHONE_IMAGE_SETTINGS)
    const [phoneImageError, setPhoneImageError] = useState<string | null>(null)
    const [phoneImageModalOpen, setPhoneImageModalOpen] = useState(false)
    const [isAddingDivider, setIsAddingDivider] = useState(false)
    const [importTitlesDialogOpen, setImportTitlesDialogOpen] = useState(false)
    const [lastUsedQuickTitle, setLastUsedQuickTitle] = useState<string | null>(null)
    const [quickTitleDialog, setQuickTitleDialog] = useState({
        open: false,
        initialValue: '',
        personName: '',
        isSaving: false,
        error: '',
    })

    // refs focus
    const titleRef = useRef<HTMLInputElement>(null)
    const nameRef = useRef<HTMLInputElement>(null)
    const occupationRef = useRef<HTMLInputElement>(null)
    const locationRef = useRef<HTMLInputElement>(null)

    const sectionId = activeSectionId ?? ''
    const selectedLookupEntityType =
        selected?.entityType === 'persons' && activeEntityType === 'phoneCalls'
            ? 'phoneCalls'
            : selected?.entityType
    // ✅ memoize list + selectedItem (prevents "Maximum update depth exceeded")
    const selectedItems = useMemo(() => {
        if (!selected || !selectedLookupEntityType) return []
        return getBlockItems(selected.sectionId, selectedLookupEntityType)
    }, [getBlockItems, selected?.sectionId, selectedLookupEntityType])

    const selectedItem = useMemo(() => {
        if (!selected) return null
        return selectedItems.find((x: any) => x.id === selected.id) ?? null
    }, [selectedItems, selected?.id])

    useEffect(() => {
        setLastUsedQuickTitle(null)
    }, [activeEntityType, activeSectionId, selected?.id, selected?.entityType, selected?.sectionId])

    useEffect(() => {
        let isMounted = true

        phoneImageSettingsService.getPhoneImageSettings().then((settings) => {
            if (isMounted) {
                setPhoneImageSettings(settings)
            }
        })

        return () => {
            isMounted = false
        }
    }, [])

    // ---- helpers ----
    const focusPrimaryInput = useCallback(() => {
        let el: HTMLInputElement | null = null

        if (editorEntityType === 'persons') el = nameRef.current
        else if (editorEntityType === 'locations' || editorEntityType === 'waitLocations') el = locationRef.current
        else el = titleRef.current

        if (!el) return
        el.focus()
        const len = el.value.length
        try {
            el.setSelectionRange(len, len)
        } catch {
            // ignore (some inputs might not support selection range)
        }
    }, [editorEntityType])

    const focusTitleInput = useCallback(() => {
        const el = titleRef.current
        if (!el) return
        el.focus()
        const len = el.value.length
        try {
            el.setSelectionRange(len, len)
        } catch {
            // ignore
        }
    }, [])

    // ✅ populate form (ONLY when selection identity changes)
    useEffect(() => {
        if (!selected || !selectedItem) {
            setForm({})
            setLastUsedQuickTitle(null)
            return
        }

        const data = (selectedItem as any).data

        switch (selected.entityType) {
            case 'persons':
                setForm({
                    name: data?.name ?? '',
                    occupation: data?.occupation ?? '',
                    image: data?.image ?? '',
                })
                setPhoneImageError(null)
                break

            case 'locations':
                setForm({
                    location: data?.location ?? '',
                })
                break

            default:
                setForm({
                    title: data?.title ?? '',
                })
        }
    }, [selected?.id, selected?.entityType, selected?.sectionId, selectedItem])

    // ✅ autofocus whenever context changes (tab, selection, section)
    useEffect(() => {
        focusPrimaryInput()
    }, [focusPrimaryInput, activeEntityType, selected?.id, selected?.sectionId])

    useEffect(() => {
        if (isAllowedInActiveSection) return
        clearSelection()
        setActiveEntityType('titles')
    }, [clearSelection, isAllowedInActiveSection, setActiveEntityType])

    // ✅ ESC clears selection + resets editor
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            if (!selected) return

            e.preventDefault()
            clearSelection()
            setForm({})
            setLastUsedQuickTitle(null)
            // keep same activeViewType, but return to create mode
            requestAnimationFrame(() => focusPrimaryInput())
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selected, clearSelection, focusPrimaryInput])

    const updateField = (key: keyof FormState, value: string) => {
        if (key === 'title' && !value.trim()) {
            setLastUsedQuickTitle(null)
        }

        setForm((prev) => ({ ...prev, [key]: value }))
    }

    // ✅ normalize only at SAVE time (prevents cursor jumping while editing)
    const normalizeForm = (f: FormState): FormState => {
        const next = { ...f }
        if (next.title) next.title = next.title.toUpperCase()
        if (next.name) next.name = next.name.toUpperCase()
        if (next.location) next.location = next.location.toUpperCase()
        // occupation stays mixed-case
        return next
    }

    const isFormValid = (): boolean => {
        if (!sectionId || !isAllowedInActiveSection) return false

        switch (activeEntityType) {
            case 'persons':
                return Boolean(form.name?.trim())

            case 'phoneCalls':
                return Boolean(form.name?.trim() && form.image?.trim())

            case 'locations':
            case 'waitLocations':
                return Boolean(form.location?.trim())

            case 'titles':
            case 'hotTitles':
            case 'waitTitles':
            default:
                return Boolean(form.title?.trim())
        }
    }

    const canAddTitleDivider =
        activeSection?.kind === 'invited' &&
        activeEntityType === 'titles' &&
        editorEntityType === 'titles'
    const canImportTitlesFromBackup = canAddTitleDivider

    const addTitleDivider = async () => {
        if (!canAddTitleDivider || isAddingDivider) return

        setIsAddingDivider(true)

        try {
            const selectedTitleRowId =
                selected?.sectionId === sectionId && selected.entityType === 'titles'
                    ? (selectedItem as any)?.rowId
                    : undefined
            const result = selectedTitleRowId
                ? await addPlateauTitleDivider({ afterItemId: selectedTitleRowId })
                : await addPlateauTitleDivider()

            if (!result.ok) {
                showErrorToast(result.error ?? 'TITLE_DIVIDER_SAVE_FAILED')
            }
        } finally {
            setIsAddingDivider(false)
        }
    }

    const saveEntity = async () => {
        if (!isFormValid()) {
            setShowInvalid(true)
            setTimeout(() => setShowInvalid(false), 600)
            return
        }

        const payload = normalizeForm(form)

        if (activeEntityType === 'persons') {
            const savedPersonName = payload.name ?? ''
            const shouldPromptQuickTitle =
                activeSection?.kind === 'invited' &&
                !payload.image?.trim()
            const result = await savePersonEntity({
                sectionId: selected?.sectionId ?? sectionId,
                id: selected?.id,
                data: payload,
            })

            if (!result.ok) {
                console.error('Person save failed:', result.error)
                return
            }

            if (selected && selectedItem) {
                clearSelection()
            }

            setForm({})
            setLastUsedQuickTitle(null)
            requestAnimationFrame(() => focusPrimaryInput())

            if (shouldPromptQuickTitle) {
                setQuickTitleDialog({
                    open: true,
                    initialValue: buildPersonQuickTitleSuggestion({
                        personName: savedPersonName,
                        existingQuickTitles: quickTitles,
                    }),
                    personName: savedPersonName,
                    isSaving: false,
                    error: '',
                })
            }
            return
        }

        if (selected && selectedItem) {
            updateEntity(selected.sectionId, selected.entityType, selected.id, payload)
            clearSelection()
        } else {
            // create mode: use active section + active entity type
            addEntity(sectionId, editorEntityType, payload)
        }

        setForm({})
        setLastUsedQuickTitle(null)
        requestAnimationFrame(() => focusPrimaryInput())
    }

    // ✅ QuickTitle: insert at beginning; if already has "XXX: " prefix, replace it
    const applyQuickTitle = (prefix: string) => {
        const result = applyQuickTitleToEditor({
            editorValue: form.title ?? '',
            selectedQuickTitle: prefix,
            lastUsedQuickTitle,
        })

        setForm((prev) => {
            return { ...prev, title: result.editorValue }
        })
        setLastUsedQuickTitle(result.lastUsedQuickTitle)

        requestAnimationFrame(() => focusTitleInput())
    }

    const previewTemplate = templateDocument.templates[getTemplateKeyForViewType(activeEntityType)]
    const previewData = createPreviewData(activeEntityType, form)
    const phoneImageFilename = form.image
        ? getPhoneImageDisplayFilename(form.image) || form.image
        : ''

    return (
        <div className="app-panel app-editor bg-white rounded border p-4 flex flex-col gap-4 min-h-0 min-w-0 max-w-full overflow-hidden">

            <div
                data-testid="entity-preview-container"
                className="app-preview-container min-h-0 min-w-0 overflow-hidden"
            >
                <Preview16x9
                    template={previewTemplate}
                    data={previewData}
                    fitMode="width"
                    maxHeight={700}
                />
            </div>

            {/* inputs */}
            <div className="flex flex-col gap-3 w-full font-bold shrink-0">
                {editorEntityType === 'persons' && (
                    <>
                        <InputField
                            label="Nume"
                            value={form.name ?? ''}
                            uppercase
                            inputRef={nameRef}
                            onChange={(v) => updateField('name', v)}
                            onEnter={() => occupationRef.current?.focus()}
                            invalid={showInvalid}
                        />

                        <InputField
                            label="Funcție"
                            value={form.occupation ?? ''}
                            inputRef={occupationRef}
                            onChange={(v) => updateField('occupation', v)}
                            onEnter={saveEntity}
                        />

                        {activeEntityType === 'phoneCalls' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setPhoneImageModalOpen(true)}
                                    className="app-button app-button-secondary rounded border border-blue-500 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                                >
                                    {form.image ? 'Change Photo' : 'Add Photo'}
                                </button>

                                {form.image && (
                                    <div className="app-notification app-notification-success rounded border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                                        Poză adăugată: {phoneImageFilename}
                                    </div>
                                )}

                                {phoneImageError && (
                                    <div className="app-notification app-notification-danger rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                                        {phoneImageError}
                                    </div>
                                )}

                                {form.name?.trim() && !form.image?.trim() && !phoneImageError && (
                                    <div className="app-notification app-notification-warning rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                                        Adaugă o poză înainte de salvare.
                                    </div>
                                )}

                                <PhoneImageModal
                                    open={phoneImageModalOpen}
                                    settings={phoneImageSettings}
                                    initialFilename={form.image?.replace(/^WORK_PATH\//, '')}
                                    suggestedFilename={buildSuggestedPhoneImageFilename(form.name ?? '')}
                                    onClose={() => setPhoneImageModalOpen(false)}
                                    onSaved={(imageCsvValue) => {
                                        setPhoneImageError(null)
                                        updateField('image', imageCsvValue)
                                    }}
                                />
                            </>
                        )}
                    </>
                )}

                {(editorEntityType === 'locations' || editorEntityType === 'waitLocations') && (
                    <InputField
                        label="Locație"
                        value={form.location ?? ''}
                        uppercase
                        inputRef={locationRef}
                        onChange={(v) => updateField('location', v)}
                        onEnter={saveEntity}
                        invalid={showInvalid}
                    />
                )}

                {(editorEntityType === 'titles' || editorEntityType === 'hotTitles' || editorEntityType === 'waitTitles') && (
                    <InputField
                        label="Titlu"
                        value={form.title ?? ''}
                        inputRef={titleRef}
                        onChange={(v) => updateField('title', v)}
                        onEnter={saveEntity}
                        invalid={showInvalid}
                    />
                )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center">
                    <button
                        onClick={saveEntity}
                        disabled={!isFormValid()}
                        className={`app-button app-button-primary app-work-primary-button flex-1 py-2 rounded text-white ${
                            isFormValid() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {selected ? 'Update' : 'Adaugă'}
                    </button>

                    {canImportTitlesFromBackup && (
                        <button
                            type="button"
                            aria-label="Importă din arhivă"
                            title="Importă din arhivă"
                            onClick={() => setImportTitlesDialogOpen(true)}
                            className="app-button app-button-secondary app-import-backup-button ml-6 flex h-10 w-12 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <ArchiveImportIcon />
                        </button>
                    )}

                    {canAddTitleDivider && (
                        <button
                            type="button"
                            aria-label="Separator vizual"
                            title="Adauga separator vizual"
                            onClick={addTitleDivider}
                            disabled={isAddingDivider}
                            className="app-button app-divider-button ml-8 flex h-10 w-12 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <DividerButtonIcon />
                        </button>
                    )}
                </div>

            </div>

            {/* QuickTitles doar la TITLES */}
            {editorEntityType === 'titles' && (
                <div className="app-panel-divider border-t pt-3 mt-2 shrink-0">
                    <div className="text-xs text-gray-500 mb-2">Prefixe rapide</div>
                    <QuickTitlesBar
                        onApplyPrefix={applyQuickTitle}
                        focusEditor={focusTitleInput}
                        activeQuickTitle={lastUsedQuickTitle}
                    />
                </div>
            )}

            <PersonQuickTitleDialog
                open={quickTitleDialog.open}
                initialValue={quickTitleDialog.initialValue}
                personName={quickTitleDialog.personName}
                isSaving={quickTitleDialog.isSaving}
                error={quickTitleDialog.error || undefined}
                onSave={async (value) => {
                    setQuickTitleDialog((prev) => ({ ...prev, isSaving: true, error: '' }))

                    try {
                        await setAllQuickTitles(normalizeAndDeduplicateQuickTitles([
                            ...quickTitles,
                            value,
                        ]))
                        setQuickTitleDialog((prev) => ({
                            ...prev,
                            open: false,
                            isSaving: false,
                            error: '',
                        }))
                    } catch (error) {
                        setQuickTitleDialog((prev) => ({
                            ...prev,
                            isSaving: false,
                            error: error instanceof Error ? error.message : 'QUICK_TITLE_SAVE_FAILED',
                        }))
                    }
                }}
                onCancel={() => setQuickTitleDialog((prev) => ({ ...prev, open: false, error: '' }))}
            />

            <ImportTitlesFromBackupDialog
                open={importTitlesDialogOpen}
                onClose={() => setImportTitlesDialogOpen(false)}
                onImport={async (items) => {
                    const result = await importPlateauTitlesFromBackup(items)

                    if (!result.ok) {
                        showErrorToast(result.error)
                    }

                    return result
                }}
            />
        </div>
    )
}
