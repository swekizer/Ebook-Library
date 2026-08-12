import { App, Modal } from "obsidian";

interface PromptModalOptions {
	title: string;
	placeholder?: string;
	initialValue?: string;
	submitText?: string;
	onSubmit: (value: string) => void;
}

export class PromptModal extends Modal {
	private options: PromptModalOptions;

	constructor(app: App, options: PromptModalOptions) {
		super(app);
		this.options = options;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("el-prompt-modal");
		contentEl.createEl("h3", { text: this.options.title });

		const input = contentEl.createEl("input", {
			type: "text",
			cls: "el-prompt-input",
			value: this.options.initialValue ?? "",
			placeholder: this.options.placeholder ?? "",
		});
		input.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter") {
				evt.preventDefault();
				this.submit(input.value);
			}
		});
		window.setTimeout(() => {
			input.focus();
			input.select();
		}, 0);

		const buttons = contentEl.createDiv({ cls: "el-modal-buttons" });
		const cancelBtn = buttons.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const okBtn = buttons.createEl("button", { cls: "mod-cta", text: this.options.submitText ?? "OK" });
		okBtn.addEventListener("click", () => this.submit(input.value));
	}

	private submit(value: string): void {
		this.options.onSubmit(value.trim());
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
