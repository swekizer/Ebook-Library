import { App, FuzzySuggestModal, TFile } from "obsidian";

export class FileSuggestModal extends FuzzySuggestModal<TFile> {
	private onChoose: (file: TFile) => void;
	private extensions?: string[];

	constructor(app: App, onChoose: (file: TFile) => void, extensions?: string[]) {
		super(app);
		this.onChoose = onChoose;
		this.extensions = extensions;
		this.setPlaceholder(
			extensions ? "Find an image in your vault..." : "Find a file in your vault..."
		);
	}

	getItems(): TFile[] {
		const files = this.app.vault.getFiles();
		if (!this.extensions) return files;
		const exts = this.extensions;
		return files.filter((f) => exts.includes(f.extension.toLowerCase()));
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}
