export function normalizeTitleForDuplicateCheck(value: string): string {
    return value.trim().toLowerCase()
}

export function findDuplicateTitleIds(
    titles: Array<{
        id: string
        title: string
    }>
): Set<string> {
    const idsByTitle = new Map<string, string[]>()

    for (const title of titles) {
        const normalizedTitle = normalizeTitleForDuplicateCheck(title.title)

        if (normalizedTitle === '') continue

        idsByTitle.set(normalizedTitle, [
            ...(idsByTitle.get(normalizedTitle) ?? []),
            title.id,
        ])
    }

    const duplicateIds = new Set<string>()

    for (const ids of idsByTitle.values()) {
        if (ids.length < 2) continue

        for (const id of ids) {
            duplicateIds.add(id)
        }
    }

    return duplicateIds
}
