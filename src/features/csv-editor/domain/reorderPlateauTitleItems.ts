import type { PlateauTitleListItem } from './plateauTitleList'

export type ReorderPlateauTitleItemsResult =
    | {
        ok: true
        items: PlateauTitleListItem[]
    }
    | {
        ok: false
        reason:
            | 'active-not-found'
            | 'target-not-found'
            | 'consecutive-dividers'
    }

function getItemId(item: PlateauTitleListItem): string {
    return item.type === 'title' ? item.rowId : item.id
}

function hasConsecutiveDividers(items: PlateauTitleListItem[]): boolean {
    return items.some((item, index) => item.type === 'divider' && items[index + 1]?.type === 'divider')
}

export function reorderPlateauTitleItems(
    items: PlateauTitleListItem[],
    activeId: string,
    overId: string
): ReorderPlateauTitleItemsResult {
    const activeIndex = items.findIndex((item) => getItemId(item) === activeId)
    if (activeIndex < 0) {
        return { ok: false, reason: 'active-not-found' }
    }

    const overIndex = items.findIndex((item) => getItemId(item) === overId)
    if (overIndex < 0) {
        return { ok: false, reason: 'target-not-found' }
    }

    if (activeIndex === overIndex) {
        return { ok: true, items: [...items] }
    }

    const nextItems = [...items]
    const [activeItem] = nextItems.splice(activeIndex, 1)
    nextItems.splice(overIndex, 0, activeItem)

    if (hasConsecutiveDividers(nextItems)) {
        return { ok: false, reason: 'consecutive-dividers' }
    }

    return { ok: true, items: nextItems }
}
