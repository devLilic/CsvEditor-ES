# QuickTitle Toggle

`activeQuickTitle` is transient editor state for the single QuickTitle that is currently ON. It is not persisted to CSV, localStorage, settings, or a project file.

Clicking an inactive QuickTitle turns it ON, replaces an existing leading QuickTitle-style prefix, and preserves the rest of the title. Selecting another QuickTitle turns the previous one OFF and the selected one ON.

Clicking the active QuickTitle turns it OFF and removes only that prefix. For example, `INVITAT: Ion Popescu` becomes `Ion Popescu`; an editor containing only `INVITAT: ` becomes empty. Manually removing or changing the active prefix also turns the QuickTitle OFF.

An active prefix without a title body cannot be saved. After a successful add or update, the complete title is sent to the entities list and the editor returns to the active prefix so the operator can enter the next title.

The active QuickTitle is reset when the editor context changes, including selecting another title, changing entity type, changing section, or resetting the form. The transition from a successful update back to create mode is the exception: it preserves the active QuickTitle and restores its prefix.
