import type { EntitiesState } from '@/features/csv-editor/domain/entities'
import { serializeTitleBackup, type TitleBackupListItem } from '../domain/titleBackupCsv'

export type WriteActiveTitleBackupDeps = {
    writePaTitlesCsv(): Promise<{ ok: boolean; error?: string }>
    getActiveTitleBackupFile(): Promise<string | null>
    writeTitleBackup(input: { filename: string; content: string }): Promise<{ ok: boolean; error?: string }>
    onBackupError?: (error: { filename: string; message: string }) => void
}

export type WriteActiveTitleBackupResult =
    | {
        ok: true
        paTitlesOk: true
        backupAttempted: boolean
        backupOk: boolean
    }
    | {
        ok: false
        paTitlesOk: false
        backupAttempted: false
        backupOk: false
        error?: string
    }

export function mapPlateauItemsToTitleBackupItems(
    entities: EntitiesState,
): TitleBackupListItem[] {
    const plateau = entities.sections.find((section) => section.kind === 'invited')

    if (!plateau) {
        return []
    }

    return plateau.rows.flatMap<TitleBackupListItem>((row) => {
        if (row.title) {
            return [{
                type: 'title',
                title: row.title.title,
            } satisfies TitleBackupListItem]
        }

        if (row.titleDivider) {
            return [{ type: 'divider' } satisfies TitleBackupListItem]
        }

        return []
    })
}

export async function writeActiveTitleBackup(input: {
    entities: EntitiesState
    deps: WriteActiveTitleBackupDeps
}): Promise<WriteActiveTitleBackupResult> {
    const paTitlesResult = await input.deps.writePaTitlesCsv()

    if (!paTitlesResult.ok) {
        return {
            ok: false,
            paTitlesOk: false,
            backupAttempted: false,
            backupOk: false,
            error: paTitlesResult.error,
        }
    }

    const activeTitleBackupFile = await input.deps.getActiveTitleBackupFile()
    if (!activeTitleBackupFile) {
        return {
            ok: true,
            paTitlesOk: true,
            backupAttempted: false,
            backupOk: false,
        }
    }

    const backupResult = await input.deps.writeTitleBackup({
        filename: activeTitleBackupFile,
        content: serializeTitleBackup(mapPlateauItemsToTitleBackupItems(input.entities)),
    })

    if (!backupResult.ok) {
        input.deps.onBackupError?.({
            filename: activeTitleBackupFile,
            message: backupResult.error ?? 'TITLE_BACKUP_WRITE_FAILED',
        })

        return {
            ok: true,
            paTitlesOk: true,
            backupAttempted: true,
            backupOk: false,
        }
    }

    return {
        ok: true,
        paTitlesOk: true,
        backupAttempted: true,
        backupOk: true,
    }
}
