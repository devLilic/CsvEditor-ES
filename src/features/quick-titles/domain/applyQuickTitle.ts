import { normalizeQuickTitle } from './quickTitle'

export type ApplyQuickTitleInput = {
    editorValue: string
    selectedQuickTitle: string
    activeQuickTitle: string | null
}

export type ApplyQuickTitleResult = {
    editorValue: string
    activeQuickTitle: string | null
    toggledOn: boolean
}

export function applyQuickTitle(
    input: ApplyQuickTitleInput
): ApplyQuickTitleResult {
    const selectedQuickTitle = normalizeQuickTitle(input.selectedQuickTitle)
    const activeQuickTitle = input.activeQuickTitle === null
        ? null
        : normalizeQuickTitle(input.activeQuickTitle)
    const isSelectedQuickTitleActive = selectedQuickTitle === activeQuickTitle

    if (isSelectedQuickTitleActive) {
        const hasSelectedPrefix = input.editorValue
            .toUpperCase()
            .startsWith(selectedQuickTitle)

        return {
            editorValue: hasSelectedPrefix
                ? input.editorValue.slice(selectedQuickTitle.length)
                : input.editorValue,
            activeQuickTitle: null,
            toggledOn: false,
        }
    }

    const cleaned = input.editorValue.replace(/^[^:]+:\s*/, '').trimStart()

    return {
        editorValue: `${selectedQuickTitle}${cleaned}`,
        activeQuickTitle: selectedQuickTitle,
        toggledOn: true,
    }
}
