import type { IpcResponse } from '@/shared/ipc-types'
import { IPC_CHANNELS } from '@/shared/ipc-channels'

type ReserveTitleBackupResponse = IpcResponse<typeof IPC_CHANNELS.TITLE_BACKUP_RESERVE>

function getApi() {
    return (window as Window & { electronAPI?: { reserveTitleBackup?: (request: { forceNewProject?: boolean }) => Promise<ReserveTitleBackupResponse> } }).electronAPI
}

export const titleBackupReservationService = {
    async reserveActiveTitleBackup(forceNewProject = false): Promise<ReserveTitleBackupResponse> {
        const api = getApi()
        if (!api?.reserveTitleBackup) {
            return { ok: false, error: 'electronAPI not available' }
        }

        try {
            const response = await api.reserveTitleBackup({ forceNewProject })
            return response ?? { ok: false, error: 'NO_RESPONSE' }
        } catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : 'TITLE_BACKUP_RESERVE_FAILED',
            }
        }
    },
}
