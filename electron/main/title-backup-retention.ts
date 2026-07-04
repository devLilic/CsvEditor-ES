import * as fs from 'fs'
import * as path from 'path'
import type { AppConfig } from '../../src/shared/ipc-types'
import {
    createConfigWithActiveTitleBackupFile,
    getActiveTitleBackupFile,
} from '../../src/features/title-backup/domain/activeTitleBackupFile'
import { findNextTitleBackupName } from '../../src/features/title-backup/domain/titleBackupName'

const fsp = fs.promises

export const MAX_TITLE_BACKUP_FILES = 10
export const MAX_TITLE_BACKUP_WRITE_ATTEMPTS = 3

export type TitleBackupFileInfo = {
    filename: string
    fullPath: string
    mtimeMs: number
}

export type TitleBackupFs = {
    stat(filePath: string): Promise<{ isDirectory(): boolean; isFile?(): boolean; mtimeMs?: number }>
    access(filePath: string, mode?: number): Promise<void>
    readdir(filePath: string): Promise<string[]>
    readFile(filePath: string, encoding: BufferEncoding): Promise<string>
    writeFile(filePath: string, content: string, encoding: BufferEncoding): Promise<void>
    rename(oldPath: string, newPath: string): Promise<void>
    unlink(filePath: string): Promise<void>
}

export type TitleBackupStore = {
    getConfig(): AppConfig
    setConfig(config: AppConfig): AppConfig
}

export type TitleBackupWriteResult =
    | {
        ok: true
        filename: string
        fullPath: string
    }
    | {
        ok: false
        error: string
    }

export function isTitleBackupFileName(filename: string): boolean {
    return /^\d{2}_\d{2}_\d{4}_titluri(?:_(?:[2-9]|\d{2,}))?\.csv$/.test(filename)
}

export async function listTitleBackupFiles(input: {
    backupFolderPath: string
    fs?: TitleBackupFs
}): Promise<TitleBackupFileInfo[]> {
    const fileSystem = input.fs ?? fsp
    const filenames = await fileSystem.readdir(input.backupFolderPath)
    const files: TitleBackupFileInfo[] = []

    for (const filename of filenames) {
        if (!isTitleBackupFileName(filename)) {
            continue
        }

        const fullPath = path.join(input.backupFolderPath, filename)
        const stat = await fileSystem.stat(fullPath).catch(() => null)

        if (!stat || stat.isDirectory() || typeof stat.mtimeMs !== 'number') {
            continue
        }

        files.push({
            filename,
            fullPath,
            mtimeMs: stat.mtimeMs,
        })
    }

    return files.sort((a, b) => b.mtimeMs - a.mtimeMs)
}

export function getTitleBackupFilesToDelete(input: {
    files: TitleBackupFileInfo[]
    activeTitleBackupFile: string | null
    maxFiles?: number
}): TitleBackupFileInfo[] {
    const maxFiles = input.maxFiles ?? MAX_TITLE_BACKUP_FILES
    const deleteCount = input.files.length - maxFiles

    if (deleteCount <= 0) {
        return []
    }

    return [...input.files]
        .filter((file) => file.filename !== input.activeTitleBackupFile)
        .sort((a, b) => a.mtimeMs - b.mtimeMs)
        .slice(0, deleteCount)
}

export async function cleanupOldTitleBackups(input: {
    backupFolderPath: string
    activeTitleBackupFile: string | null
    fs?: TitleBackupFs
}): Promise<void> {
    const fileSystem = input.fs ?? fsp
    const files = await listTitleBackupFiles({
        backupFolderPath: input.backupFolderPath,
        fs: fileSystem,
    })
    const filesToDelete = getTitleBackupFilesToDelete({
        files,
        activeTitleBackupFile: input.activeTitleBackupFile,
    })

    for (const file of filesToDelete) {
        await fileSystem.unlink(file.fullPath)
    }
}

export async function writeTitleBackupAtomic(input: {
    backupFolderPath: string
    filename: string
    content: string
    fs?: TitleBackupFs
}): Promise<TitleBackupWriteResult> {
    const fileSystem = input.fs ?? fsp
    const fullPath = path.join(input.backupFolderPath, input.filename)
    let lastError: unknown = null

    for (let attempt = 1; attempt <= MAX_TITLE_BACKUP_WRITE_ATTEMPTS; attempt += 1) {
        const tempPath = `${fullPath}.${attempt}.tmp`

        try {
            await fileSystem.writeFile(tempPath, input.content, 'utf-8')
            await fileSystem.rename(tempPath, fullPath)

            return {
                ok: true,
                filename: input.filename,
                fullPath,
            }
        } catch (error) {
            lastError = error
            await fileSystem.unlink(tempPath).catch(() => undefined)
        }
    }

    return {
        ok: false,
        error: lastError instanceof Error ? lastError.message : 'TITLE_BACKUP_WRITE_FAILED',
    }
}

export async function writeTitleBackupWithRetention(input: {
    backupFolderPath: string
    filename: string
    content: string
    fs?: TitleBackupFs
}): Promise<TitleBackupWriteResult> {
    const fileSystem = input.fs ?? fsp
    const folderPath = input.backupFolderPath.trim()

    if (!folderPath) {
        return { ok: false, error: 'No backup folder configured' }
    }

    const stat = await fileSystem.stat(folderPath).catch(() => null)
    if (!stat?.isDirectory()) {
        return { ok: false, error: 'Backup folder does not exist' }
    }

    await fileSystem.access(folderPath, fs.constants.W_OK)

    const result = await writeTitleBackupAtomic({
        backupFolderPath: folderPath,
        filename: input.filename,
        content: input.content,
        fs: fileSystem,
    })

    if (!result.ok) {
        return result
    }

    await cleanupOldTitleBackups({
        backupFolderPath: folderPath,
        activeTitleBackupFile: input.filename,
        fs: fileSystem,
    })

    return result
}

export async function readTitleBackup(input: {
    backupFolderPath: string
    filename: string
    fs?: TitleBackupFs
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
    try {
        if (!isTitleBackupFileName(input.filename)) {
            return { ok: false, error: 'Invalid title backup filename' }
        }

        const fileSystem = input.fs ?? fsp
        const content = await fileSystem.readFile(path.join(input.backupFolderPath, input.filename), 'utf-8')
        return { ok: true, content }
    } catch (error) {
        return { ok: false, error: (error as Error).message }
    }
}

export async function reserveTitleBackupName(input: {
    backupFolderPath: string
    date: Date
    forceNewProject?: boolean
    store: TitleBackupStore
    fs?: TitleBackupFs
}): Promise<{ ok: true; filename: string } | { ok: false; error: string }> {
    try {
        const currentConfig = input.store.getConfig()
        const activeFile = getActiveTitleBackupFile(currentConfig)

        if (activeFile && !input.forceNewProject) {
            return { ok: true, filename: activeFile }
        }

        const files = await listTitleBackupFiles({
            backupFolderPath: input.backupFolderPath,
            fs: input.fs,
        })
        const existingFileNames = files.map((file) => file.filename)
        const unavailableFileNames = activeFile
            ? [...existingFileNames, activeFile]
            : existingFileNames
        const filename = findNextTitleBackupName(input.date, unavailableFileNames)

        input.store.setConfig(createConfigWithActiveTitleBackupFile(currentConfig, filename))

        return { ok: true, filename }
    } catch (error) {
        return { ok: false, error: (error as Error).message }
    }
}
