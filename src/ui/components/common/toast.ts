export type AppToastKind = 'error'

export type AppToastDetail = {
    kind: AppToastKind
    message: string
}

export const APP_TOAST_EVENT = 'app-toast'
const TOAST_TIMEOUT_MS = 3000
const TOAST_ELEMENT_ID = 'app-error-toast'

export function showErrorToast(message: string): void {
    const existingToast = document.getElementById(TOAST_ELEMENT_ID)
    existingToast?.remove()

    const toast = document.createElement('div')
    toast.id = TOAST_ELEMENT_ID
    toast.setAttribute('role', 'alert')
    toast.className = 'app-notification app-notification-danger fixed bottom-4 right-4 z-50 max-w-sm rounded border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 shadow-lg'
    toast.textContent = message
    document.body.appendChild(toast)

    window.setTimeout(() => {
        if (toast.isConnected) {
            toast.remove()
        }
    }, TOAST_TIMEOUT_MS)
}
