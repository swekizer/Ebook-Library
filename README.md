# Ebook Library

A beautiful, central library for the books, manga, magazines and documents already living in your Obsidian vault - browse covers, organize with tags, and track reading progress. Inspired by Apple Books, Google Play Books and Kindle.

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7c3aed)

## Features

- **A dedicated Library view** - opens as a normal tab in your workspace, with a big page title, live stats (`12 books · 3 reading · 2 completed`), and a responsive cover grid that adapts to any Obsidian theme (light/dark, community themes).
- **Add Book modal** - set a cover (pick an image already in your vault, or paste a URL), title, author, category, tags, description, rating, total pages, reading status and progress.
- **Smart placeholder covers** - books without a cover image get a generated gradient cover (colour derived from the title) with a category icon, so the grid always looks polished.
- **Search, filter & sort** - full-text search across title/author/description/tags, filter by category or tag, filter by status (All / Unread / Reading / Completed), and sort by title, author, date added, recently opened, or progress.
- **Per-book progress bar** - shown right on the cover, Kindle-style, plus a "Reading"/"Done" badge.
- **Right-click menu** on every card - open, edit, mark unread/reading/completed, jump progress to 0/25/50/75/100%, reveal in system file explorer, open in the OS default app (great for `.epub`/`.mobi`/`.docx` that Obsidian can't render natively), or remove from the library.
- **Tags with autocomplete-style suggestions** - reuses tags you've already created across your library.
- **Handles file moves** - renaming/moving a catalogued file (or its cover image) in the vault automatically updates the library entry.
- **Backup tools** - export your whole library's metadata to a JSON note from the settings tab.
- Works on **desktop and mobile** (a couple of desktop-only convenience actions - reveal in explorer / open in default app - are hidden automatically on mobile).

Books can be any file type already in your vault: PDF, EPUB, Markdown notes, CBZ/CBR comics, Word docs, plain text, etc. The plugin catalogs them with rich metadata; opening a book asks Obsidian to open the file (using its built-in viewer when one exists, e.g. PDF), and you can always fall back to "Open in default app".

## Installing

### Manual install (no build needed)

The compiled plugin is already built in this folder. Copy the whole `Ebook Library Plugin` folder into your vault's plugin directory, and make sure it's named `ebook-library`:

```
<your-vault>/.obsidian/plugins/ebook-library/
├── main.js
├── manifest.json
└── styles.css
```

Then, in Obsidian: **Settings → Community plugins → Reload plugins**, and enable "Ebook Library".

### Build from source

```bash
npm install
npm run build   # one-off production build -> main.js
# or
npm run dev      # watches src/ and rebuilds on save
```

## Release a new version

This repo supports tag-based GitHub releases for Obsidian.

1. Finish your code changes.
2. Bump the plugin version:

```bash
npm version patch
```

Use `minor` or `major` when needed.

3. Push the commit and tag:

```bash
git push origin main --follow-tags
```

4. GitHub Actions will automatically:

- install dependencies
- build `main.js`
- verify the tag matches `manifest.json`
- create the GitHub release
- upload `main.js`, `manifest.json`, and `styles.css`

For Obsidian Community Plugins, the release assets should always include exactly those plugin files.

## Using it

- Click the **library** icon in the ribbon, or run **"Ebook Library: Open library"** from the command palette, to open the library view.
- Click **+ Add Book** (or run **"Ebook Library: Add a new book"**) to catalog a file. Use the folder icon next to "Book file" to browse your vault.
- Click a cover to open the book. Right-click (or use the `⋮` button on hover) for quick actions.
- Use the search bar, category/tag dropdowns, sort dropdown, and the Unread/Reading/Completed tabs to slice your library.
- Visit the plugin's settings tab to rename the library title, change the cover size, enable "open on startup", or export a backup.

## Data storage

Book metadata (title, author, tags, description, progress, etc.) is stored in the plugin's own `data.json` (standard Obsidian plugin storage) - it does not modify your book files or write frontmatter into them. Cover images are referenced either by vault path or external URL; nothing is copied or duplicated.

## Project structure

```
src/
├── main.ts                 Plugin entry point, book CRUD, commands, ribbon icon
├── types.ts                Book/settings types, category & status metadata
├── utils.ts                Small helpers (ids, dates, placeholder colours, OS integration)
├── view/
│   └── LibraryView.ts       The library grid view (header, toolbar, cards, context menu)
├── modals/
│   ├── BookModal.ts         Add/Edit book form
│   ├── FileSuggestModal.ts  Fuzzy file/image picker from the vault
│   ├── PromptModal.ts       Small single-field prompt (used for cover URLs)
│   └── ConfirmModal.ts      Generic confirm/cancel dialog
└── settings/
    └── SettingsTab.ts       Plugin settings tab
styles.css                   All plugin styling
```

## Ideas for later

- Automatic reading-progress tracking for PDFs by hooking into the PDF viewer's page state.
- Drag-and-drop files straight onto the library to add them.
- Collections/shelves for grouping books beyond tags.
- Import covers from an ISBN/title lookup (e.g. Open Library API).
