import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type EbookLibraryPlugin from "../main";
import { ConfirmModal } from "../modals/ConfirmModal";
import { CardSize } from "../types";

export class EbookLibrarySettingTab extends PluginSettingTab {
	plugin: EbookLibraryPlugin;

	constructor(app: App, plugin: EbookLibraryPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Library title")
			.setDesc("The big title shown at the top of your library view.")
			.addText((text) =>
				text
					.setPlaceholder("Library")
					.setValue(this.plugin.settings.libraryTitle)
					.onChange(async (value) => {
						this.plugin.settings.libraryTitle = value || "Library";
						await this.plugin.saveSettings();
						this.plugin.refreshViews();
					})
			);

		new Setting(containerEl)
			.setName("Card size")
			.setDesc("Size of book covers in the library grid.")
			.addDropdown((drop) =>
				drop
					.addOptions({ small: "Small", medium: "Medium", large: "Large" })
					.setValue(this.plugin.settings.cardSize)
					.onChange(async (value) => {
						this.plugin.settings.cardSize = value as CardSize;
						await this.plugin.saveSettings();
						this.plugin.refreshViews();
					})
			);

		new Setting(containerEl)
			.setName("Open library on startup")
			.setDesc("Automatically open your library when Obsidian starts.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.openOnStartup).onChange(async (value) => {
					this.plugin.settings.openOnStartup = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl).setName("Backup").setHeading();

		new Setting(containerEl)
			.setName("Export library data")
			.setDesc("Save all your book entries as a JSON file in the vault.")
			.addButton((btn) =>
				btn.setButtonText("Export").onClick(async () => {
					const json = JSON.stringify(this.plugin.settings.books, null, 2);
					const path = `Ebook Library Backup ${new Date().toISOString().slice(0, 10)}.json`;
					try {
						await this.app.vault.create(path, json);
						new Notice(`Exported to "${path}"`);
					} catch (e) {
						new Notice(`Export failed: ${(e as Error).message}`);
					}
				})
			);

		new Setting(containerEl).setName("Danger zone").setHeading();

		new Setting(containerEl)
			.setName("Clear all books")
			.setDesc("Remove every book from your library. This cannot be undone.")
			.addButton((btn) =>
				btn
					.setButtonText("Clear library")
					.setWarning()
					.onClick(() => {
						new ConfirmModal(this.app, {
							title: "Clear library",
							message: "Remove all books from your library? This cannot be undone.",
							confirmText: "Clear library",
							onConfirm: async () => {
								this.plugin.settings.books = [];
								await this.plugin.saveSettings();
								this.plugin.refreshViews();
								new Notice("Library cleared");
							},
						}).open();
					})
			);
	}
}
