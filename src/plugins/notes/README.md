# Notes Plugin

A single autosaving scratchpad, stored in plugin-namespaced storage
(`content` key), debounced 300ms.

## Roadmap hooks

Multiple notes / a note list is a natural extension: swap the single
`content` string for a `notes: Note[]` array in storage, add a list view,
and reuse the same debounced-save pattern per note.
