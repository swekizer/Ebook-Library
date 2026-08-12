import { App, FileSystemAdapter, Notice, Platform } from "obsidian";

export function generateId(): string {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function getBasename(path: string): string {
	const parts = path.split("/");
	const last = parts[parts.length - 1] ?? path;
	const dot = last.lastIndexOf(".");
	return dot > 0 ? last.slice(0, dot) : last;
}

export function getExtension(path: string): string {
	const dot = path.lastIndexOf(".");
	return dot >= 0 ? path.slice(dot + 1).toLowerCase() : "";
}

/** Deterministically maps a string to a hue (0-359) so covers get a stable color. */
export function stringToHue(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
		hash |= 0;
	}
	return Math.abs(hash) % 360;
}

export function placeholderGradient(seed: string): string {
	const hue = stringToHue(seed || "book");
	const hue2 = (hue + 38) % 360;
	return `linear-gradient(150deg, hsl(${hue}, 62%, 46%), hsl(${hue2}, 58%, 26%))`;
}

export function formatRelativeDate(timestamp: number | null): string {
	if (!timestamp) return "Never opened";
	const diff = Date.now() - timestamp;
	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;
	if (diff < minute) return "Just now";
	if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
	if (diff < day) return `${Math.floor(diff / hour)}h ago`;
	if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
	return new Date(timestamp).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
	let timer: number | undefined;
	return ((...args: any[]) => {
		if (timer) window.clearTimeout(timer);
		timer = window.setTimeout(() => fn(...args), delay);
	}) as T;
}

/** Reveals a vault file in the OS file explorer. Desktop only. */
export function revealInSystemExplorer(app: App, filePath: string): void {
	if (!Platform.isDesktopApp) return;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) return;
	try {
		const fullPath = adapter.getFullPath(filePath);
		const electron = require("electron");
		electron.shell.showItemInFolder(fullPath);
	} catch (e) {
		new Notice("Could not open the system file explorer.");
	}
}

/** Opens a vault file with the OS default application. Desktop only. */
export function openInDefaultApp(app: App, filePath: string): void {
	if (!Platform.isDesktopApp) return;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) return;
	try {
		const fullPath = adapter.getFullPath(filePath);
		const electron = require("electron");
		electron.shell.openPath(fullPath).then((err: string) => {
			if (err) new Notice(`Could not open file: ${err}`);
		});
	} catch (e) {
		new Notice("Could not open file in the default app.");
	}
}
