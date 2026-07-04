import Papa from 'papaparse'

export const TITLE_BACKUP_DIVIDER = '[ DIVIDER ]'

export type TitleBackupListItem =
    | {
        type: 'title'
        title: string
    }
    | {
        type: 'divider'
    }

export function serializeTitleBackup(items: TitleBackupListItem[]): string {
    const rows: string[][] = []
    let previousWasDivider = false

    for (const item of items) {
        if (item.type === 'divider') {
            if (previousWasDivider) {
                continue
            }

            rows.push([TITLE_BACKUP_DIVIDER])
            previousWasDivider = true
            continue
        }

        rows.push([item.title])
        previousWasDivider = false
    }

    return Papa.unparse(rows, {
        header: false,
        delimiter: ',',
        newline: '\n',
    })
}

export function parseTitleBackup(content: string): {
    items: TitleBackupListItem[]
    valid: boolean
    errors: string[]
} {
    const parsed = Papa.parse<string[]>(content, {
        header: false,
        delimiter: ',',
        skipEmptyLines: false,
    })
    const items: TitleBackupListItem[] = []
    const errors: string[] = []
    let previousWasDivider = false

    if (parsed.errors.length > 0) {
        errors.push(...parsed.errors.map((error) => error.message))
    }

    parsed.data.forEach((row, index) => {
        const rowNumber = index + 1
        const cells = Array.isArray(row) ? row : [String(row ?? '')]
        const hasExtraContent = cells.slice(1).some((cell) => String(cell ?? '').trim() !== '')

        if (hasExtraContent) {
            errors.push(`Row ${rowNumber} has more than one column.`)
        }

        const value = String(cells[0] ?? '').trim()

        if (value === '') {
            return
        }

        if (value === TITLE_BACKUP_DIVIDER) {
            if (previousWasDivider) {
                errors.push(`Row ${rowNumber} has a consecutive divider.`)
            }

            items.push({ type: 'divider' })
            previousWasDivider = true
            return
        }

        items.push({
            type: 'title',
            title: value,
        })
        previousWasDivider = false
    })

    return {
        items,
        valid: errors.length === 0,
        errors,
    }
}
