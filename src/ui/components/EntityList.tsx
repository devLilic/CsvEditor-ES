// src/ui/components/EntityList.tsx
import { Fragment, type ButtonHTMLAttributes, type DOMAttributes, type ReactNode, useEffect, useMemo, useState } from 'react'
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    useEntities,
    useSelectedEntity,
    useActiveEntityType,
    isSupportedEntityType,
} from '@/features/csv-editor'
import type { EntityType, PlateauTitleListItem } from '@/features/csv-editor'
import { findDuplicateTitleIds } from '@/features/csv-editor/domain/findDuplicateTitles'
import { reorderPlateauTitleItems as previewPlateauTitleReorder } from '@/features/csv-editor/domain/reorderPlateauTitleItems'
import { settingsService } from '@/features/csv-editor/services/settingsService'
import { EmptyState } from './common/EmptyState'
import { PlateauTitleDivider } from './titles/PlateauTitleDivider'
import { useEditMode } from '@/ui/context/EditModeContext'
import { useTitleFilter } from '@/ui/context/TitleFilterContext'
import { showErrorToast } from './common/toast'

const CONSECUTIVE_TITLE_DIVIDERS_DROP_ERROR = 'Nu pot exista două separatoare consecutive.'

function getPlateauItemId(item: any): string {
    return item.type === 'divider' ? item.id : item.rowId ?? item.id
}

function getPlateauTitleListItems(items: any[]): PlateauTitleListItem[] {
    return items.flatMap<PlateauTitleListItem>((item) => {
        if (item.type === 'divider') return [{ type: 'divider', id: item.id } satisfies PlateauTitleListItem]
        if (item.entityType === 'titles' && item.rowId) return [{ type: 'title', rowId: item.rowId } satisfies PlateauTitleListItem]
        return []
    })
}

function DragHandle({ attributes, listeners }: {
    attributes?: ButtonHTMLAttributes<HTMLButtonElement>
    listeners?: DOMAttributes<HTMLButtonElement>
}) {
    return (
        <button
            type="button"
            aria-label="Muta elementul"
            title="Muta elementul"
            {...attributes}
            {...listeners}
            className="app-drag-handle flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 active:cursor-grabbing"
        >
            <span aria-hidden="true" className="text-lg leading-none">=</span>
        </button>
    )
}

function SortableRow({ id, children }: { id: string; children: (dragHandle: ReactNode) => ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })
    const verticalTransform = transform
        ? { ...transform, x: 0 }
        : transform

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(verticalTransform),
                transition,
            }}
            className={isDragging ? 'opacity-60' : undefined}
        >
            {children(<DragHandle attributes={attributes} listeners={listeners} />)}
        </div>
    )
}

export function EntityList() {
    const {
        activeSectionId,
        activeSection,
        getBlockItems,
        deleteEntity,
        deletePlateauTitleDivider,
        reorderPlateauTitleItems,
    } = useEntities()

    const { activeEntityType } = useActiveEntityType()
    const { select, isSelected } = useSelectedEntity()
    const { editMode } = useEditMode()
    const { titleFilter } = useTitleFilter()
    const [deletingDividerId, setDeletingDividerId] = useState<string | null>(null)
    const [enablePlateauTitleDragDrop, setEnablePlateauTitleDragDrop] = useState<boolean | null>(null)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const sectionId = activeSectionId ?? activeSection?.id ?? ''
    const supportedEntityType = isSupportedEntityType(activeEntityType)
        ? activeEntityType
        : null
    const normalizedTitleFilter = titleFilter.trim().toLocaleLowerCase()
    const items = useMemo(() => {
        if (!sectionId || !supportedEntityType) {
            return []
        }

        return getBlockItems(sectionId, supportedEntityType)
    }, [getBlockItems, sectionId, supportedEntityType])

    useEffect(() => {
        let isMounted = true

        settingsService.getPlateauTitleDragDropEnabled().then((enabled) => {
            if (isMounted) {
                setEnablePlateauTitleDragDrop(enabled)
            }
        })

        return () => {
            isMounted = false
        }
    }, [])

    const filteredItems = useMemo(() => {
        if (supportedEntityType !== 'titles' || !normalizedTitleFilter) {
            return items
        }

        return items.filter((item: any) =>
            item.type !== 'divider' &&
            (item.data?.title ?? '')
                .toLocaleLowerCase()
                .includes(normalizedTitleFilter)
        )
    }, [items, normalizedTitleFilter, supportedEntityType])
    const duplicatePlateauTitleIds = useMemo(() => {
        if (activeSection?.kind !== 'invited' || supportedEntityType !== 'titles') {
            return new Set<string>()
        }

        return findDuplicateTitleIds(
            items.flatMap((item: any) => {
                if (item.type === 'divider' || item.entityType !== 'titles') return []

                return [{
                    id: item.id,
                    title: item.data?.title ?? '',
                }]
            })
        )
    }, [activeSection?.kind, items, supportedEntityType])

    if (!sectionId) {
        return <EmptyState text="Nu exista sectiune activa." />
    }

    if (!filteredItems.length) {
        if (supportedEntityType === 'titles' && normalizedTitleFilter) {
            return (
                <EmptyState text="Nu exista titluri care contin sintagma cautata." />
            )
        }

        return <EmptyState text="Nu exista elemente in aceasta sectiune." />
    }

    const showNr = supportedEntityType === 'titles'
    const canDragPlateauTitles =
        activeSection?.kind === 'invited' &&
        supportedEntityType === 'titles' &&
        editMode &&
        enablePlateauTitleDragDrop === true
    const sortableItemIds = items.map((item: any) => getPlateauItemId(item))
    const titleNumberById = new Map<string, number>()
    items.forEach((item: any) => {
        if (item.type === 'divider' || item.entityType !== 'titles') return
        titleNumberById.set(item.id, titleNumberById.size + 1)
    })

    const handleDeleteDivider = async (dividerId: string) => {
        setDeletingDividerId(dividerId)

        const result = await deletePlateauTitleDivider(dividerId)

        setDeletingDividerId(null)
        if (!result.ok) {
            showErrorToast(result.error ?? 'TITLE_DIVIDER_DELETE_FAILED')
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const activeId = String(event.active.id)
        const overId = event.over?.id ? String(event.over.id) : ''
        if (!activeId || !overId || activeId === overId) return

        const previewResult = previewPlateauTitleReorder(
            getPlateauTitleListItems(items),
            activeId,
            overId
        )

        if (!previewResult.ok) {
            if (previewResult.reason === 'consecutive-dividers') {
                showErrorToast(CONSECUTIVE_TITLE_DIVIDERS_DROP_ERROR)
            }
            return
        }

        const result = await reorderPlateauTitleItems(activeId, overId)
        if (!result.ok) {
            showErrorToast(result.error ?? 'TITLE_REORDER_FAILED')
        }
    }

    const renderItem = (item: any, dragHandle?: ReactNode) => {
        let renderedItem: ReactNode

        if (item.type === 'divider') {
            renderedItem = (
                <PlateauTitleDivider
                    dividerId={item.id}
                    canDelete
                    isDeleting={deletingDividerId === item.id}
                    dragHandle={dragHandle}
                    onDelete={handleDeleteDivider}
                />
            )
        } else {
            const selected = isSelected(
                sectionId,
                item.entityType as EntityType,
                item.id
            )

            const isTitle = item.entityType === 'titles'
            const isPersons = item.entityType === 'persons'
            const isDuplicatePlateauTitle = isTitle && duplicatePlateauTitleIds.has(item.id)
            const displayNr = isTitle ? titleNumberById.get(item.id) ?? null : null
            const mainText = isPersons
                ? item.data?.name ?? ''
                : item.data?.title ?? item.data?.location ?? ''
            const subText = isPersons ? item.data?.occupation ?? '' : ''

            renderedItem = (
                <div
                    onClick={() =>
                        select({
                            sectionId,
                            entityType: item.entityType,
                            id: item.id,
                            viewType: supportedEntityType ?? undefined,
                        })
                    }
                    className={`app-list-row group px-3 py-2 cursor-pointer flex justify-between items-center gap-3 border-b border-l-4
                        ${
                            selected
                                ? 'bg-blue-100 border-l-blue-600'
                                : isDuplicatePlateauTitle
                                    ? 'bg-[var(--duplicate-title-bg)] hover:bg-[var(--duplicate-title-bg)] border-l-[var(--duplicate-title-border)] text-[var(--duplicate-title-text)]'
                                : 'hover:bg-gray-100 border-l-transparent'
                        }
                    `}
                >
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                        {dragHandle}
                        <div className="min-w-0 overflow-hidden">
                            {showNr && displayNr !== null ? (
                                <div className="flex min-w-0 gap-2">
                                    <span className="shrink-0 font-semibold text-gray-500">
                                        {displayNr}.
                                    </span>
                                    <span className="truncate font-bold">
                                        {mainText}
                                    </span>
                                </div>
                            ) : isPersons ? (
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate font-bold">
                                        {mainText}
                                    </span>
                                    <span className="truncate text-sm text-gray-600">
                                        {subText}
                                    </span>
                                </div>
                            ) : (
                                <span className="truncate font-bold">
                                    {mainText}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {editMode && (
                            <button
                                title="Sterge"
                                aria-label="Sterge"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    deleteEntity(
                                        sectionId,
                                        item.entityType,
                                        item.id
                                    )
                                }}
                                className="app-button app-button-danger border border-red-700 bg-red-500 px-2 text-xs text-white rounded hover:bg-red-800"
                            >
                                x
                            </button>
                        )}
                    </div>
                </div>
            )
        }

        const itemId = getPlateauItemId(item)
        if (!canDragPlateauTitles || dragHandle) {
            return <Fragment key={itemId}>{renderedItem}</Fragment>
        }

        return (
            <SortableRow key={itemId} id={itemId}>
                {(dragHandle) => renderItem(item, dragHandle)}
            </SortableRow>
        )
    }

    return (
        <div className="app-list h-full min-h-0 overflow-y-auto">
            {canDragPlateauTitles ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={sortableItemIds} strategy={verticalListSortingStrategy}>
                        <div className="app-list-panel rounded border bg-white">
                            {filteredItems.map((item) => renderItem(item))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="app-list-panel rounded border bg-white">
                    {filteredItems.map((item) => renderItem(item))}
                </div>
            )}
        </div>
    )
}
