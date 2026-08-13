import { App, Modal, setIcon } from "obsidian";

interface ConfirmModalOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void | Promise<void>;
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
		const titleRow = contentEl.createEl("h3", { cls: "el-confirm-title" });
		setIcon(titleRow.createSpan({ cls: "el-confirm-title-icon" }), "alert-triangle");
		titleRow.createSpan({ text: this.options.title });
		contentEl.createEl("p", { text: this.options.message });

		const buttons = contentEl.createDiv({ cls: "el-modal-buttons" });
		const cancelBtn = buttons.createEl("button", { text: this.options.cancelText ?? "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const confirmBtn = buttons.createEl("button", {
			text: this.options.confirmText ?? "Confirm",
			cls: "mod-warning",
		});
		confirmBtn.addEventListener("click", () => {
			const result = this.options.onConfirm();
			if (result instanceof Promise) {
				result.catch((err: unknown) => console.error("Ebook Library:", err));
			}
			this.close();
		});

		window.setTimeout(() => confirmBtn.focus(), 0);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
