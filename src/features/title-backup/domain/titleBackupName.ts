export function formatTitleBackupDate(date: Date): string {
    const day = pad2(date.getDate())
    const month = pad2(date.getMonth() + 1)
    const year = date.getFullYear()

    return `${day}_${month}_${year}`
}

export function buildTitleBackupBaseName(date: Date): string {
    return `${formatTitleBackupDate(date)}_titluri.csv`
}

export function findNextTitleBackupName(
    date: Date,
    existingFileNames: string[],
): string {
    const datePart = formatTitleBackupDate(date)
    const baseName = buildTitleBackupBaseName(date)
    const usedSuffixes = new Set<number>()
    const titleBackupPattern = new RegExp(`^${datePart}_titluri(?:_(\\d+))?\\.csv$`)

    for (const fileName of existingFileNames) {
        const match = fileName.match(titleBackupPattern)

        if (!match) {
            continue
        }

        usedSuffixes.add(match[1] ? Number(match[1]) : 1)
    }

    if (!usedSuffixes.has(1)) {
        return baseName
    }

    let suffix = 2
    while (usedSuffixes.has(suffix)) {
        suffix += 1
    }

    return `${datePart}_titluri_${suffix}.csv`
}

function pad2(value: number): string {
    return String(value).padStart(2, '0')
}
