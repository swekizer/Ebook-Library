import { App, Modal } from "obsidian";

interface ConfirmModalOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
}

export class ConfirmModal extends Modal {
	private options: ConfirmModalOptions;

	constructor(app: App, options: ConfirmModalOptions) {
		super(app);
		this.options = options;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("el-confirm-modal");
		contentEl.createEl("h3", { text: this.options.title });
		contentEl.createEl("p", { text: this.options.message });

		const buttons = contentEl.createDiv({ cls: "el-modal-buttons" });
		const cancelBtn = buttons.createEl("button", { text: this.options.cancelText ?? "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const confirmBtn = buttons.createEl("button", {
			text: this.options.confirmText ?? "Confirm",
			cls: "mod-warning",
		});
		confirmBtn.addEventListener("click", () => {
			this.options.onConfirm();
			this.close();
		});

		window.setTimeout(() => confirmBtn.focus(), 0);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
