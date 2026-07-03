# Bookmarks Plugin

Lists the immediate children of the browser's Bookmarks Bar via
`chrome.bookmarks`. Requires the `bookmarks` and `favicon` manifest
permissions (already declared). Falls back to a friendly message when
`chrome.bookmarks` isn't available (e.g. running under `vite dev` in a plain
browser tab).

## Roadmap hooks

Folder navigation (clicking a folder to descend into it) is a natural next
step — `findBookmarksBar` already walks the full tree; the controller just
needs a "current folder id" piece of state and a back button in the view.
