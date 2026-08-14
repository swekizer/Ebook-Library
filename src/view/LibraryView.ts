import { ItemView, Menu, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import type EbookLibraryPlugin from "../main";
import {
	Book,
	CardSize,
	CATEGORY_META,
	CATEGORY_ORDER,
	CategoryFilter,
	SortKey,
	STATUS_META,
	StatusFilter,
} from "../types";
import { BookModal } from "../modals/BookModal";
import { ConfirmModal } from "../modals/ConfirmModal";
import { clamp, debounce, placeholderGradient } from "../utils";

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

const CARD_SIZES: { value: CardSize; label: string; aria: string }[] = [
	{ value: "small", label: "S", aria: "Small cards" },
	{ value: "medium", label: "M", aria: "Medium cards" },
	{ value: "large", label: "L", aria: "Large cards" },
];

const CONTINUE_RAIL_LIMIT = 8;

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
	private densityGroupEl!: HTMLElement;
	private tabsEl!: HTMLElement;
	private resultsCountEl!: HTMLElement;
	private continueSectionEl!: HTMLElement;
	private continueRailEl!: HTMLElement;
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

		const hero = root.createDiv({ cls: "el-hero" });
		const header = hero.createDiv({ cls: "el-header" });
		const headerTop = header.createDiv({ cls: "el-header-top" });

		const titleGroup = headerTop.createDiv({ cls: "el-header-title-group" });
		setIcon(titleGroup.createDiv({ cls: "el-icon-badge" }), "library");
		const titleTextWrap = titleGroup.createDiv();
		this.headerTitleEl = titleTextWrap.createEl("h1", {
			cls: "el-title",
			text: this.plugin.settings.libraryTitle,
		});
		this.statsEl = titleTextWrap.createDiv({ cls: "el-stats" });

		const addBtn = headerTop.createEl("button", { cls: "el-add-btn" });
		setIcon(addBtn.createSpan({ cls: "el-add-btn-icon" }), "plus");
		addBtn.createSpan({ text: "Add Book" });
		addBtn.addEventListener("click", () => this.openAddModal());

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

		toolbar.createDiv({ cls: "el-toolbar-divider" });

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
			void this.plugin.saveSettings();
			this.render();
		});

		this.sortDirBtn = filters.createEl("button", {
			cls: "el-sort-dir-btn",
			attr: { "aria-label": "Toggle sort direction" },
		});
		setIcon(this.sortDirBtn, "arrow-up-down");
		this.sortDirBtn.addEventListener("click", () => {
			this.plugin.settings.sortDirection = this.plugin.settings.sortDirection === "asc" ? "desc" : "asc";
			void this.plugin.saveSettings();
			this.render();
		});

		this.densityGroupEl = filters.createDiv({
			cls: "el-density-toggle",
			attr: { role: "group", "aria-label": "Card size" },
		});
		for (const size of CARD_SIZES) {
			const btn = this.densityGroupEl.createEl("button", {
				cls: "el-density-btn",
				text: size.label,
				attr: { "aria-label": size.aria },
			});
			btn.dataset.size = size.value;
			btn.addEventListener("click", () => {
				if (this.plugin.settings.cardSize === size.value) return;
				this.plugin.settings.cardSize = size.value;
				void this.plugin.saveSettings();
				this.render();
			});
		}

		this.tabsEl = root.createDiv({ cls: "el-tabs" });
		for (const tab of STATUS_TABS) {
			const btn = this.tabsEl.createEl("button", { cls: "el-tab" });
			btn.dataset.value = tab.value;
			btn.createSpan({ cls: "el-tab-label", text: tab.label });
			btn.createSpan({ cls: "el-tab-count" });
			btn.addEventListener("click", () => {
				this.statusFilter = tab.value;
				this.render();
			});
		}

		this.resultsCountEl = root.createDiv({ cls: "el-results-count" });

		this.continueSectionEl = root.createDiv({ cls: "el-continue-section" });
		const sectionHeader = this.continueSectionEl.createDiv({ cls: "el-section-header" });
		const sectionTitle = sectionHeader.createDiv({ cls: "el-section-title" });
		setIcon(sectionTitle.createSpan({ cls: "el-section-title-icon" }), "book-open");
		sectionTitle.createSpan({ text: "Continue reading" });
		sectionHeader.createDiv({ cls: "el-section-subtitle", text: "Pick up where you left off" });
		this.continueRailEl = this.continueSectionEl.createDiv({ cls: "el-continue-rail" });

		this.gridEl = root.createDiv({ cls: "el-grid" });
	}

	// ---------- Rendering ----------

	render() {
		this.headerTitleEl.setText(this.plugin.settings.libraryTitle);
		this.populateTagOptions();
		this.updateActiveTab();
		this.updateSortDirButton();
		this.updateDensityToggle();
		this.renderStats();

		this.gridEl.empty();
		this.gridEl.removeClass("card-size-small", "card-size-medium", "card-size-large");
		this.gridEl.addClass(`card-size-${this.plugin.settings.cardSize}`);

		const totalBooks = this.plugin.settings.books.length;
		const books = this.getFilteredSortedBooks();

		this.renderResultsCount(totalBooks, books.length);
		this.renderContinueSection();

		if (totalBooks === 0) {
			this.renderEmptyState(true);
			return;
		}
		if (books.length === 0) {
			this.renderEmptyState(false);
			return;
		}
		books.forEach((book, index) => {
			this.gridEl.appendChild(this.buildCard(book, index));
		});
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
		const counts = this.getStatusCounts();
		this.tabsEl.querySelectorAll(".el-tab").forEach((el) => {
			const btn = el as HTMLElement;
			const value = (btn.dataset.value ?? "all") as StatusFilter;
			btn.toggleClass("is-active", value === this.statusFilter);
			const countEl = btn.querySelector(".el-tab-count");
			if (countEl) countEl.textContent = String(counts[value] ?? 0);
		});
	}

	private updateSortDirButton() {
		const desc = this.plugin.settings.sortDirection === "desc";
		this.sortDirBtn.setAttribute("aria-label", desc ? "Sorted descending" : "Sorted ascending");
		this.sortDirBtn.toggleClass("is-desc", desc);
	}

	private updateDensityToggle() {
		this.densityGroupEl.querySelectorAll(".el-density-btn").forEach((el) => {
			const btn = el as HTMLElement;
			const isActive = btn.dataset.size === this.plugin.settings.cardSize;
			btn.toggleClass("is-active", isActive);
			btn.setAttribute("aria-pressed", String(isActive));
		});
	}

	private addStatChip(icon: string, value: string, label: string, extraCls?: string) {
		const chip = this.statsEl.createDiv({ cls: extraCls ? `el-stat-chip ${extraCls}` : "el-stat-chip" });
		setIcon(chip.createSpan({ cls: "el-stat-chip-icon" }), icon);
		chip.createEl("strong", { text: value });
		chip.appendText(` ${label}`);
		return chip;
	}

	private renderStats() {
		this.statsEl.empty();
		const books = this.plugin.settings.books;
		const total = books.length;
		if (total === 0) return;

		const reading = books.filter((b) => b.status === "reading").length;
		const completed = books.filter((b) => b.status === "completed").length;
		const pct = Math.round((completed / total) * 100);

		this.addStatChip("library", String(total), total === 1 ? "book" : "books");
		this.addStatChip("book-open", String(reading), "reading");
		this.addStatChip("check-circle", String(completed), "completed");

		const ringChip = this.statsEl.createDiv({ cls: "el-stat-chip el-stat-chip-ring" });
		const ring = ringChip.createDiv({ cls: "el-stat-ring" });
		ring.setCssStyles({
			background: `conic-gradient(var(--interactive-accent) ${pct}%, var(--background-modifier-border) 0)`,
		});
		ringChip.appendText(`${pct}% complete`);
	}

	private renderResultsCount(total: number, shown: number) {
		const filtersActive =
			this.statusFilter !== "all" ||
			this.categoryFilter !== "all" ||
			this.tagFilter !== "all" ||
			!!this.searchQuery;

		if (total === 0 || !filtersActive) {
			this.resultsCountEl.setText("");
			this.resultsCountEl.removeClass("is-visible");
			return;
		}
		this.resultsCountEl.setText(`Showing ${shown} of ${total} ${total === 1 ? "book" : "books"}`);
		this.resultsCountEl.addClass("is-visible");
	}

	/** Applies every filter except reading status — used both for the grid and for tab counts. */
	private getBooksMatchingNonStatusFilters(): Book[] {
		let books = this.plugin.settings.books.slice();

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
		return books;
	}

	private getStatusCounts(): Record<StatusFilter, number> {
		const books = this.getBooksMatchingNonStatusFilters();
		return {
			all: books.length,
			unread: books.filter((b) => b.status === "unread").length,
			reading: books.filter((b) => b.status === "reading").length,
			completed: books.filter((b) => b.status === "completed").length,
		};
	}

	private getFilteredSortedBooks(): Book[] {
		let books = this.getBooksMatchingNonStatusFilters();

		if (this.statusFilter !== "all") {
			books = books.filter((b) => b.status === this.statusFilter);
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

	// ---------- Continue reading rail ----------

	private renderContinueSection() {
		const isDefaultView =
			this.statusFilter === "all" &&
			this.categoryFilter === "all" &&
			this.tagFilter === "all" &&
			!this.searchQuery;

		const readingBooks = this.plugin.settings.books
			.filter((b) => b.status === "reading")
			.sort((a, b) => (b.lastOpened ?? b.dateModified) - (a.lastOpened ?? a.dateModified))
			.slice(0, CONTINUE_RAIL_LIMIT);

		const shouldShow = isDefaultView && readingBooks.length > 0;
		this.continueSectionEl.toggleClass("is-visible", shouldShow);
		this.continueRailEl.empty();
		if (!shouldShow) return;

		for (const book of readingBooks) {
			this.continueRailEl.appendChild(this.buildContinueCard(book));
		}
	}

	private buildContinueCard(book: Book): HTMLElement {
		const card = createDiv({ cls: "el-continue-card" });
		card.setAttribute("tabindex", "0");
		card.setAttribute("role", "button");
		card.setAttribute("aria-label", `Continue reading ${book.title}`);

		// Cover — portrait 2:3, with progress bar embedded at bottom edge
		const cover = card.createDiv({ cls: "el-continue-cover" });
		this.renderCover(cover, book);

		// Progress track sits inside the cover (absolutely positioned via CSS)
		if (book.progress > 0) {
			const track = cover.createDiv({ cls: "el-continue-progress-track" });
			track.createDiv({ cls: "el-continue-progress-fill" }).setCssStyles({
				width: `${clamp(book.progress, 0, 100)}%`,
			});
		}

		// Info below the cover
		const info = card.createDiv({ cls: "el-continue-info" });
		info.createDiv({ cls: "el-continue-title", text: book.title });
		if (book.author) info.createDiv({ cls: "el-continue-author", text: book.author });

		if (book.progress > 0) {
			const progressRow = info.createDiv({ cls: "el-continue-progress-row" });
			progressRow.createDiv({
				cls: "el-continue-progress-label",
				text: `${Math.round(clamp(book.progress, 0, 100))}% complete`,
			});
		}

		card.addEventListener("click", () => void this.plugin.openBook(book));
		card.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter" || evt.key === " ") {
				evt.preventDefault();
				void this.plugin.openBook(book);
			}
		});
		return card;
	}

	// ---------- Card ----------

	private buildCard(book: Book, index: number): HTMLElement {
		const card = createDiv({ cls: "el-card" });
		card.setAttribute("tabindex", "0");
		card.setAttribute("role", "button");
		card.setAttribute("aria-label", `Open ${book.title}`);
		card.setCssStyles({ animationDelay: `${Math.min(index * 25, 400)}ms` });

		const cover = card.createDiv({ cls: "el-card-cover" });
		this.renderCover(cover, book);

		const fileExists = !!this.plugin.app.vault.getAbstractFileByPath(book.filePath);
		if (!fileExists) {
			const badge = cover.createDiv({ cls: "el-badge el-badge-missing" });
			setIcon(badge, "alert-triangle");
			badge.setAttribute("aria-label", "File not found in vault");
		} else if (book.status !== "unread") {
			const meta = STATUS_META[book.status];
			const badge = cover.createDiv({ cls: `el-badge el-badge-${book.status}` });
			setIcon(badge.createSpan({ cls: "el-badge-icon" }), meta.icon);
			badge.createSpan({ text: book.status === "completed" ? "Done" : "Reading" });
		}

		setIcon(cover.createDiv({ cls: "el-card-hover-open", attr: { "aria-hidden": "true" } }), "book-open");

		if (book.progress > 0) {
			const track = cover.createDiv({ cls: "el-card-progress-track" });
			track.createDiv({ cls: "el-card-progress-fill" }).setCssStyles({
				width: `${clamp(book.progress, 0, 100)}%`,
			});
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

		const tagsRow = info.createDiv({ cls: "el-card-tags" });
		const categoryPill = tagsRow.createSpan({ cls: "el-tag-pill el-tag-pill-category" });
		setIcon(categoryPill.createSpan({ cls: "el-tag-pill-icon" }), CATEGORY_META[book.category].icon);
		categoryPill.appendText(CATEGORY_META[book.category].label);

		if (book.rating > 0) {
			tagsRow.createSpan({
				cls: "el-card-rating",
				text: "\u2605".repeat(book.rating),
				attr: { "aria-label": `${book.rating} star rating` },
			});
		}

		const shownTags = book.tags.slice(0, 2);
		for (const tag of shownTags) {
			tagsRow.createSpan({ cls: "el-tag-pill", text: tag });
		}
		if (book.tags.length > shownTags.length) {
			tagsRow.createSpan({
				cls: "el-tag-pill el-tag-more",
				text: `+${book.tags.length - shownTags.length}`,
			});
		}

		card.addEventListener("click", () => {
			void this.plugin.openBook(book);
		});
		card.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter" || evt.key === " ") {
				evt.preventDefault();
				void this.plugin.openBook(book);
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
		container.setCssStyles({ background: placeholderGradient(book.title || book.filePath) });
		const iconWrap = container.createDiv({ cls: "el-cover-placeholder-icon" });
		setIcon(iconWrap, CATEGORY_META[book.category]?.icon ?? "book");
		container.createDiv({ cls: "el-cover-placeholder-title", text: book.title });
	}

	private showCardMenu(evt: MouseEvent, book: Book) {
		const menu = new Menu();

		menu.addItem((item) =>
			item
				.setTitle("Open")
				.setIcon("book-open")
				.onClick(() => {
					void this.plugin.openBook(book);
				})
		);
		menu.addItem((item) =>
			item.setTitle("Edit details").setIcon("pencil").onClick(() => this.openEditModal(book))
		);

		menu.addSeparator();

		menu.addItem((item) =>
			item
				.setTitle("Mark as unread")
				.setIcon("circle")
				.setChecked(book.status === "unread")
				.onClick(() => {
					void this.plugin.updateBook(book.id, { status: "unread", progress: 0 });
				})
		);
		menu.addItem((item) =>
			item
				.setTitle("Mark as reading")
				.setIcon("book-open")
				.setChecked(book.status === "reading")
				.onClick(() => {
					void this.plugin.updateBook(book.id, { status: "reading" });
				})
		);
		menu.addItem((item) =>
			item
				.setTitle("Mark as completed")
				.setIcon("check-circle")
				.setChecked(book.status === "completed")
				.onClick(() => {
					void this.plugin.updateBook(book.id, { status: "completed", progress: 100 });
				})
		);

		menu.addSeparator();

		for (const step of [0, 25, 50, 75, 100]) {
			menu.addItem((item) =>
				item
					.setTitle(`Set progress to ${step}%`)
					.setChecked(book.progress === step)
					.onClick(() => {
						void this.plugin.updateBook(book.id, {
							progress: step,
							status: step === 0 ? "unread" : step === 100 ? "completed" : "reading",
						});
					})
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
