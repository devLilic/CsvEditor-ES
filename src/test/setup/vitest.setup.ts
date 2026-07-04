// src/test/setup/vitest.setup.ts
import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'
import { ipcMock } from '../mocks/ipcMock'

beforeEach(() => {
    // 🔒 sursa adevărului
    ;(globalThis as any).electronAPI = ipcMock

    // 🔁 mirror pentru cod care folosește window
    if (typeof window !== 'undefined') {
        ;(window as any).electronAPI = ipcMock
    }

    vi.clearAllMocks()
    ipcMock.reserveTitleBackup.mockResolvedValue({ ok: true, filename: '03_07_2026_titluri.csv' })
})
