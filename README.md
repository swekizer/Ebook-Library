# Ebook Library

Turn the files in your Obsidian vault into a beautiful, personal reading library.

Ebook Library gives your books, manga, magazines, articles, comics, PDFs, and documents a polished cover-based home inside Obsidian. Organize everything in one place, see what you are reading, and open any title with a click.

![Ebook Library in Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7c3aed)

<!-- Screenshot suggestion: Add an overview screenshot here.
Suggested file: images/library-overview.png
Description: The Ebook Library view showing the title, search and filter toolbar,
status tabs, Continue Reading section, and a grid of book covers. -->

## Why you'll love it

- **A beautiful library view** - Browse your collection in a responsive cover grid inspired by modern reading apps.
- **Keep your files where they are** - Catalog files already in your vault without moving, copying, or modifying them.
- **Know what to read next** - A dedicated Continue Reading section brings your latest reading title to the front.
- **Organize your way** - Add categories, tags, descriptions, ratings, covers, and reading statuses to every title.
- **Find anything quickly** - Search by title, author, description, or tag, then filter by category, tag, or reading status.
- **Works with any reading collection** - Catalog PDFs, EPUBs, Markdown notes, CBZ/CBR comics, Word documents, plain text files, and more.
- **Looks at home in Obsidian** - Designed to work with light mode, dark mode, and community themes.

## Features

### Your collection, beautifully presented

Add a cover from your vault or use an image URL. If a book does not have a cover, Ebook Library creates an attractive gradient placeholder with a category icon, so your library never looks unfinished.

<!-- Screenshot suggestion: Add a cover-grid screenshot here.
Suggested file: images/book-grid.png
Description: A close-up of the library grid showing book covers, titles, authors,
category labels, reading statuses, and the three-dot card menu. -->

Each card shows the information you care about at a glance:

- Title and author
- Category and tags
- Reading or completed status
- Recently opened information

### Simple organization

Give each title the context it deserves with:

- Categories such as Book, Manga, Magazine, Comic, Document, Article, Audiobook, and Other
- Tags with suggestions from your existing library
- Descriptions and ratings
- Unread, Reading, and Completed statuses
- Optional total page counts

<!-- Screenshot suggestion: Add an Add/Edit Book screenshot here.
Suggested file: images/book-details.png
Description: The Add Book or Edit Book window showing the cover preview, title,
author, category, tags, description, reading status, total pages, and rating fields. -->

### Fast browsing

Use the library toolbar to:

- Search across your entire collection
- Filter by category or tag
- Switch between All, Unread, Reading, and Completed
- Sort by title, author, date added, recently opened, or reading progress
- Choose a compact, comfortable, or spacious card size

<!-- Screenshot suggestion: Add a search and filters screenshot here.
Suggested file: images/search-and-filters.png
Description: The library toolbar with the search field, category and tag filters,
sort controls, card-size controls, and status tabs being used to narrow a collection. -->

### Open and manage your books

Click a cover to open the file in Obsidian. For formats Obsidian cannot display, you can open the file in your operating system's default application. The card menu also lets you edit details, update reading status, reveal files on desktop, or remove an entry without deleting the original file.

<!-- Screenshot suggestion: Add a Continue Reading screenshot here.
Suggested file: images/continue-reading.png
Description: The Continue Reading card highlighting the current reading title,
cover, author, last-opened information, and Open book action. -->

### Safe and portable

Ebook Library stores its catalog metadata in Obsidian's normal plugin data. Your book files are not changed, and cover files are referenced rather than duplicated. If you move a cataloged book or cover inside your vault, the library updates its reference automatically.

You can also export your library metadata as a JSON backup from the plugin settings.

## Installation

### From the Obsidian Community Plugins store

1. Open **Settings** in Obsidian.
2. Go to **Community plugins** and make sure community plugins are enabled.
3. Select **Browse**.
4. Search for **Ebook Library**.
5. Select **Install**, then **Enable**.

Once enabled, open the library from the library icon in the ribbon or from the command palette.

### Manual installation

1. Download the latest release files: `main.js`, `manifest.json`, and `styles.css`.
2. Create this folder in your vault:

   ```text
   <your-vault>/.obsidian/plugins/ebook-library/
   ```

3. Copy the three downloaded files into that folder.
4. In Obsidian, open **Settings → Community plugins**.
5. Choose **Reload plugins**, then enable **Ebook Library**.

## Getting started

1. Open Ebook Library from the ribbon icon or the command palette.
2. Select **+ Add Book**.
3. Choose a file from your vault.
4. Add a title, author, cover, category, tags, and reading status.
5. Select **Add to library**.

After that, click any cover to open it, or use the search and filters to explore your collection.

## Settings

Open **Settings → Ebook Library** to:

- Rename your library
- Change the card size
- Open the library automatically when Obsidian starts
- Export a JSON backup of your library
- Clear the catalog when you want to start over

<!-- Screenshot suggestion: Add a settings screenshot here.
Suggested file: images/settings.png
Description: The Ebook Library settings tab showing library title, card size,
startup behavior, export, and clear-library controls. -->

Clearing the catalog removes entries from Ebook Library only. It does not delete the underlying files from your vault.

## Privacy and data

Ebook Library is designed to work with the files already in your vault. Book metadata is saved in the plugin's local `data.json` file. The plugin does not upload your library or modify your book files.

External cover URLs are only used when you choose to add a cover from a URL.

## Building from source

This section is for contributors and developers. Regular users do not need to build the plugin.

```bash
npm install
npm run build
```

Use `npm run dev` to rebuild while developing.

## Feedback and feature requests

If you find a bug or have an idea that would make your reading library better, please open an issue in the repository:

<https://github.com/swekizer/Ebook-Library/issues>

## Roadmap

Ideas being considered for future versions include:

- Automatic reading-progress tracking for PDFs
- Drag-and-drop adding
- Collections or shelves
- Cover lookup by ISBN or title
