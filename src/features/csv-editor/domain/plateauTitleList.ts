export const TITLE_DIVIDER_MARKER = '[ DIVIDER ]' as const

export type PlateauTitleListItem =
    | {
        type: 'title'
        rowId: string
    }
    | {
        type: 'divider'
        id: string
    }

export function isTitleDividerMarker(value: string): boolean {
    return value === TITLE_DIVIDER_MARKER
}

export function createTitleDivider(id: string): PlateauTitleListItem {
    return {
        type: 'divider',
        id,
    }
}

export function getOrderedTitleIds(items: PlateauTitleListItem[]): string[] {
    return items.flatMap((item) => (item.type === 'title' ? [item.rowId] : []))
}

export function canInsertDividerAt(items: PlateauTitleListItem[], insertIndex: number): boolean {
    if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > items.length) {
        return false
    }

    const previousItem = items[insertIndex - 1]
    const nextItem = items[insertIndex]

    return previousItem?.type !== 'divider' && nextItem?.type !== 'divider'
}

export function renumberPlateauTitles(items: PlateauTitleListItem[]): Map<string, number> {
    const numbers = new Map<string, number>()
    let titleNumber = 1

    for (const item of items) {
        if (item.type === 'title') {
            numbers.set(item.rowId, titleNumber)
            titleNumber += 1
        }
    }

    return numbers
}
