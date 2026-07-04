import { normalizeQuickTitle } from './quickTitle'

export type ApplyQuickTitleInput = {
    editorValue: string
    selectedQuickTitle: string
    lastUsedQuickTitle: string | null
}

export type ApplyQuickTitleResult = {
    editorValue: string
    lastUsedQuickTitle: string
    repeated: boolean
}

export function applyQuickTitle(
    input: ApplyQuickTitleInput
): ApplyQuickTitleResult {
    const selectedQuickTitle = normalizeQuickTitle(input.selectedQuickTitle)
    const lastUsedQuickTitle = input.lastUsedQuickTitle === null
        ? null
        : normalizeQuickTitle(input.lastUsedQuickTitle)
    const repeated = selectedQuickTitle === lastUsedQuickTitle

    if (repeated) {
        return {
            editorValue: selectedQuickTitle,
            lastUsedQuickTitle: selectedQuickTitle,
            repeated: true,
        }
    }

    const cleaned = input.editorValue.replace(/^[^:]+:\s*/, '').trimStart()

    return {
        editorValue: `${selectedQuickTitle}${cleaned}`,
        lastUsedQuickTitle: selectedQuickTitle,
        repeated: false,
    }
}
