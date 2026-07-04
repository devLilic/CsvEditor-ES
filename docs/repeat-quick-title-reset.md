# Repeat QuickTitle Reset

`lastUsedQuickTitle` is transient editor state that remembers the last QuickTitle applied in the current title editor context. It is used only to decide whether the next QuickTitle click is a repeat of the previous one.

When the operator clicks a different QuickTitle, the editor keeps the existing behavior: it replaces the current leading prefix and preserves the rest of the typed title. When the operator clicks the same QuickTitle again, the title editor is reset to exactly the selected QuickTitle. For example, `Invitat: Ion Popescu` becomes `Invitat: `.

The remembered QuickTitle is reset whenever the editor context changes: selecting another title, returning to create mode for a new title, changing entity type, changing section, resetting the form, or completing an add/update flow that clears the editor.

`lastUsedQuickTitle` is not persisted. It is not written to CSV, localStorage, settings, or any project file. It exists only in the current editor component state.
