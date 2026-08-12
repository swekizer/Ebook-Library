import { ItemView, Menu, Platform, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import type EbookLibraryPlugin from "../main";
import {
	Book,
	CATEGORY_META,
	CATEGORY_ORDER,
	CategoryFilter,
	SortKey,
	StatusFilter,
} from "../types";
import { BookModal } from "../modals/BookModal";
import { ConfirmModal } from "../modals/ConfirmModal";
import { clamp, debounce, openInDefaultApp, placeholderGradient, revealInSystemExplorer } from "../utils";

export const VIEW_TYPE_LIBRARY = "ebook-library-view";

const SORT_OPTIONS: [SortKey, string][] = [
	["dateAdded", "Date added"],
	["title", "Title"],
	["author", "Author"],
	["lastOpened", "Recently opened"],
	["progress", "Progress"],
];

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "unread", label: "Unread" },
	{ value: "reading", label: "Reading" },
	{ value: "completed", label: "Completed" },
];

export class LibraryView extends ItemView {
	private plugin: EbookLibraryPlugin;

	private searchQuery = "";
	private statusFilter: StatusFilter = "all";
	private categoryFilter: CategoryFilter = "all";
	private tagFilter = "all";

	private headerTitleEl!: HTMLElement;
	private statsEl!: HTMLElement;
	private categorySelectEl!: HTMLSelectElement;
	private tagSelectEl!: HTMLSelectElement;
	private sortSelectEl!: HTMLSelectElement;
	private sortDirBtn!: HTMLElement;
	private tabsEl!: HTMLElement;
	private gridEl!: HTMLElement;

	constructor(leaf: WorkspaceLeaf, plugin: EbookLibraryPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_LIBRARY;
	}

	getDisplayText(): string {
		return this.plugin?.settings?.libraryTitle || "Library";
	}

	getIcon(): string {
		return "library";
	}

	async onOpen() {
		this.contentEl.empty();
		this.contentEl.addClass("ebook-library-view");
		this.buildLayout();
		this.render();
	}

	async onClose() {
		this.contentEl.empty();
	}

	// ---------- Static layout (built once) ----------

	private buildLayout() {
		const root = this.contentEl;

		const header = root.createDiv({ cls: "el-header" });
		const headerTop = header.createDiv({ cls: "el-header-top" });
		this.headerTitleEl = headerTop.createEl("h1", {
			cls: "el-title",
			text: this.plugin.settings.libraryTitle,
		});
		const addBtn = headerTop.createEl("button", { cls: "el-add-btn" });
		setIcon(addBtn.createSpan({ cls: "el-add-btn-icon" }), "plus");
		addBtn.createSpan({ text: "Add Book" });
		addBtn.addEventListener("click", () => this.openAddModal());

		this.statsEl = header.createDiv({ cls: "el-stats" });

		const toolbar = root.createDiv({ cls: "el-toolbar" });

		const searchWrap = toolbar.createDiv({ cls: "el-search" });
		setIcon(searchWrap.createSpan({ cls: "el-search-icon" }), "search");
		const searchInputEl = searchWrap.createEl("input", {
			type: "text",
			placeholder: "Search title, author, tags...",
			cls: "el-search-input",
		});
		searchInputEl.addEventListener(
			"input",
			debounce(() => {
				this.searchQuery = searchInputEl.value.trim().toLowerCase();
				this.render();
			}, 150)
		);

		const filters = toolbar.createDiv({ cls: "el-filters" });

		this.categorySelectEl = filters.createEl("select", { cls: "el-select" });
		this.categorySelectEl.createEl("option", { value: "all", text: "All categories" });
		for (const cat of CATEGORY_ORDER) {
			this.categorySelectEl.createEl("option", { value: cat, text: CATEGORY_META[cat].label });
		}
		this.categorySelectEl.addEventListener("change", () => {
			this.categoryFilter = this.categorySelectEl.value as CategoryFilter;
			this.render();
		});

		this.tagSelectEl = filters.createEl("select", { cls: "el-select" });
		this.tagSelectEl.addEventListener("change", () => {
			this.tagFilter = this.tagSelectEl.value;
			this.render();
		});

		this.sortSelectEl = filters.createEl("select", { cls: "el-select" });
		for (const [key, label] of SORT_OPTIONS) {
			this.sortSelectEl.createEl("option", { value: key, text: label });
		}
		this.sortSelectEl.value = this.plugin.settings.sortKey;
		this.sortSelectEl.addEventListener("change", () => {
			this.plugin.settings.sortKey = this.sortSelectEl.value as SortKey;
			this.plugin.saveSettings();
			this.render();
		});

		this.sortDirBtn = filters.createEl("button", {
			cls: "el-sort-dir-btn",
			attr: { "aria-label": "Toggle sort direction" },
		});
		setIcon(this.sortDirBtn, "arrow-up-down");
		this.sortDirBtn.addEventListener("click", () => {
			this.plugin.settings.sortDirection = this.plugin.settings.sortDirection === "asc" ? "desc" : "asc";
			this.plugin.saveSettings();
			this.render();
		});

		this.tabsEl = root.createDiv({ cls: "el-tabs" });
		for (const tab of STATUS_TABS) {
			const btn = this.tabsEl.createEl("button", { cls: "el-tab", text: tab.label });
			btn.dataset.value = tab.value;
			btn.addEventListener("click", () => {
				this.statusFilter = tab.value;
				this.render();
			});
		}

		this.gridEl = root.createDiv({ cls: "el-grid" });
	}

	// ---------- Rendering ----------

	render() {
		this.headerTitleEl.setText(this.plugin.settings.libraryTitle);
		this.populateTagOptions();
		this.updateActiveTab();
		this.updateSortDirButton();
		this.renderStats();

		this.gridEl.empty();
		this.gridEl.removeClass("card-size-small", "card-size-medium", "card-size-large");
		this.gridEl.addClass(`card-size-${this.plugin.settings.cardSize}`);

		const totalBooks = this.plugin.settings.books.length;
		const books = this.getFilteredSortedBooks();

		if (totalBooks === 0) {
			this.renderEmptyState(true);
			return;
		}
		if (books.length === 0) {
			this.renderEmptyState(false);
			return;
		}
		for (const book of books) {
			this.gridEl.appendChild(this.buildCard(book));
		}
	}

	private populateTagOptions() {
		const current = this.tagFilter;
		this.tagSelectEl.empty();
		this.tagSelectEl.createEl("option", { value: "all", text: "All tags" });
		for (const tag of this.plugin.getAllTags()) {
			this.tagSelectEl.createEl("option", { value: tag, text: tag });
		}
		const values = Array.from(this.tagSelectEl.options).map((o) => o.value);
		this.tagFilter = values.includes(current) ? current : "all";
		this.tagSelectEl.value = this.tagFilter;
	}

	private updateActiveTab() {
		this.tabsEl.querySelectorAll(".el-tab").forEach((el) => {
			const btn = el as HTMLElement;
			btn.toggleClass("is-active", btn.dataset.value === this.statusFilter);
		});
	}

	private updateSortDirButton() {
		const desc = this.plugin.settings.sortDirection === "desc";
		this.sortDirBtn.setAttribute("aria-label", desc ? "Sorted descending" : "Sorted ascending");
		this.sortDirBtn.toggleClass("is-desc", desc);
	}

	private renderStats() {
		const books = this.plugin.settings.books;
		const total = books.length;
		if (total === 0) {
			this.statsEl.setText("");
			return;
		}
		const reading = books.filter((b) => b.status === "reading").length;
		const completed = books.filter((b) => b.status === "completed").length;
		this.statsEl.setText(
			`${total} book${total === 1 ? "" : "s"} \u00b7 ${reading} reading \u00b7 ${completed} completed`
		);
	}

	private getFilteredSortedBooks(): Book[] {
		let books = this.plugin.settings.books.slice();

		if (this.statusFilter !== "all") {
			books = books.filter((b) => b.status === this.statusFilter);
		}
		if (this.categoryFilter !== "all") {
			books = books.filter((b) => b.category === this.categoryFilter);
		}
		if (this.tagFilter !== "all") {
			books = books.filter((b) => b.tags.includes(this.tagFilter));
		}
		if (this.searchQuery) {
			const q = this.searchQuery;
			books = books.filter(
				(b) =>
					b.title.toLowerCase().includes(q) ||
					b.author.toLowerCase().includes(q) ||
					b.description.toLowerCase().includes(q) ||
					b.tags.some((t) => t.toLowerCase().includes(q))
			);
		}

		const dir = this.plugin.settings.sortDirection === "asc" ? 1 : -1;
		const key = this.plugin.settings.sortKey;
		books.sort((a, b) => {
			switch (key) {
				case "title":
					return a.title.localeCompare(b.title) * dir;
				case "author":
					return a.author.localeCompare(b.author) * dir;
				case "progress":
					return (a.progress - b.progress) * dir;
				case "lastOpened":
					return ((a.lastOpened ?? 0) - (b.lastOpened ?? 0)) * dir;
				case "dateAdded":
				default:
					return (a.dateAdded - b.dateAdded) * dir;
			}
		});

		return books;
	}

	private renderEmptyState(isLibraryEmpty: boolean) {
		const empty = this.gridEl.createDiv({ cls: "el-empty" });
		setIcon(empty.createDiv({ cls: "el-empty-icon" }), isLibraryEmpty ? "library" : "search");
		empty.createDiv({
			cls: "el-empty-title",
			text: isLibraryEmpty ? "Your library is empty" : "No books match your filters",
		});
		empty.createDiv({
			cls: "el-empty-subtitle",
			text: isLibraryEmpty
				? "Add your first book, manga, magazine or document to get started."
				: "Try a different search term, or clear your filters.",
		});
		if (isLibraryEmpty) {
			const btn = empty.createEl("button", { cls: "el-add-btn", text: "Add your first book" });
			btn.addEventListener("click", () => this.openAddModal());
		}
	}

	// ---------- Card ----------

	private buildCard(book: Book): HTMLElement {
		const card = createDiv({ cls: "el-card" });
		card.setAttribute("tabindex", "0");
		card.setAttribute("role", "button");
		card.setAttribute("aria-label", `Open ${book.title}`);

		const cover = card.createDiv({ cls: "el-card-cover" });
		this.renderCover(cover, book);

		const fileExists = !!this.plugin.app.vault.getAbstractFileByPath(book.filePath);
		if (!fileExists) {
			const badge = cover.createDiv({ cls: "el-badge el-badge-missing" });
			setIcon(badge, "alert-triangle");
			badge.setAttribute("aria-label", "File not found in vault");
		} else if (book.status !== "unread") {
			const badge = cover.createDiv({ cls: `el-badge el-badge-${book.status}` });
			badge.setText(book.status === "completed" ? "Done" : "Reading");
		}

		if (book.progress > 0) {
			const track = cover.createDiv({ cls: "el-card-progress-track" });
			track.createDiv({ cls: "el-card-progress-fill" }).style.width = `${clamp(book.progress, 0, 100)}%`;
		}

		const moreBtn = card.createEl("button", { cls: "el-card-more", attr: { "aria-label": "More options" } });
		setIcon(moreBtn, "more-vertical");
		moreBtn.addEventListener("click", (evt) => {
			evt.stopPropagation();
			this.showCardMenu(evt, book);
		});

		const info = card.createDiv({ cls: "el-card-info" });
		info.createDiv({ cls: "el-card-title", text: book.title });
		if (book.author) info.createDiv({ cls: "el-card-author", text: book.author });

		if (book.tags.length > 0) {
			const tagsRow = info.createDiv({ cls: "el-card-tags" });
			const shown = book.tags.slice(0, 2);
			for (const tag of shown) {
				tagsRow.createSpan({ cls: "el-tag-pill", text: tag });
			}
			if (book.tags.length > shown.length) {
				tagsRow.createSpan({
					cls: "el-tag-pill el-tag-more",
					text: `+${book.tags.length - shown.length}`,
				});
			}
		}

		card.addEventListener("click", () => this.plugin.openBook(book));
		card.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter" || evt.key === " ") {
				evt.preventDefault();
				this.plugin.openBook(book);
			}
		});
		card.addEventListener("contextmenu", (evt) => {
			evt.preventDefault();
			this.showCardMenu(evt, book);
		});

		return card;
	}

	private renderCover(container: HTMLElement, book: Book) {
		const src = this.resolveCoverSrc(book);
		if (src) {
			const img = container.createEl("img", { cls: "el-card-cover-img" });
			img.alt = book.title;
			img.onerror = () => {
				img.remove();
				this.renderPlaceholderCover(container, book);
			};
			img.src = src;
			return;
		}
		this.renderPlaceholderCover(container, book);
	}

	private resolveCoverSrc(book: Book): string | null {
		if (book.coverType === "url" && book.cover) return book.cover;
		if (book.coverType === "vault" && book.cover) {
			const file = this.plugin.app.vault.getAbstractFileByPath(book.cover);
			if (file instanceof TFile) return this.plugin.app.vault.getResourcePath(file);
		}
		return null;
	}

	private renderPlaceholderCover(container: HTMLElement, book: Book) {
		container.empty();
		container.addClass("el-cover-placeholder");
		container.style.background = placeholderGradient(book.title || book.filePath);
		const iconWrap = container.createDiv({ cls: "el-cover-placeholder-icon" });
		setIcon(iconWrap, CATEGORY_META[book.category]?.icon ?? "book");
		container.createDiv({ cls: "el-cover-placeholder-title", text: book.title });
	}

	private showCardMenu(evt: MouseEvent, book: Book) {
		const menu = new Menu();

		menu.addItem((item) => item.setTitle("Open").setIcon("book-open").onClick(() => this.plugin.openBook(book)));
		menu.addItem((item) =>
			item.setTitle("Edit details").setIcon("pencil").onClick(() => this.openEditModal(book))
		);

		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Mark as unread")
				.setIcon("circle")
				.setChecked(book.status === "unread")
				.onClick(() => this.plugin.updateBook(book.id, { status: "unread", progress: 0 }))
		);
		menu.addItem((item) =>
			item
				.setTitle("Mark as reading")
				.setIcon("book-open")
				.setChecked(book.status === "reading")
				.onClick(() => this.plugin.updateBook(book.id, { status: "reading" }))
		);
		menu.addItem((item) =>
			item
				.setTitle("Mark as completed")
				.setIcon("check-circle")
				.setChecked(book.status === "completed")
				.onClick(() => this.plugin.updateBook(book.id, { status: "completed", progress: 100 }))
		);

		menu.addSeparator();

		for (const step of [0, 25, 50, 75, 100]) {
			menu.addItem((item) =>
				item
					.setTitle(`Set progress to ${step}%`)
					.setChecked(book.progress === step)
					.onClick(() =>
						this.plugin.updateBook(book.id, {
							progress: step,
							status: step === 0 ? "unread" : step === 100 ? "completed" : "reading",
						})
					)
			);
		}

		if (Platform.isDesktopApp) {
			menu.addSeparator();
			menu.addItem((item) =>
				item
					.setTitle("Open in default app")
					.setIcon("external-link")
					.onClick(() => openInDefaultApp(this.plugin.app, book.filePath))
			);
			menu.addItem((item) =>
				item
					.setTitle("Reveal in system explorer")
					.setIcon("folder-open")
					.onClick(() => revealInSystemExplorer(this.plugin.app, book.filePath))
			);
		}

		menu.addSeparator();
		menu.addItem((item) =>
			item
				.setTitle("Remove from library")
				.setIcon("trash-2")
				.onClick(() => {
					new ConfirmModal(this.plugin.app, {
						title: "Remove from library",
						message: `Remove "${book.title}" from your library? The file itself will not be deleted.`,
						confirmText: "Remove",
						onConfirm: () => this.plugin.removeBook(book.id),
					}).open();
				})
		);

		menu.showAtMouseEvent(evt);
	}

	// ---------- Modals ----------

	private openAddModal() {
		new BookModal(this.plugin, null, async (data) => {
			await this.plugin.addBook(data);
		}).open();
	}

	private openEditModal(book: Book) {
		new BookModal(this.plugin, book, async (data) => {
			await this.plugin.updateBook(book.id, data);
		}).open();
	}
}
