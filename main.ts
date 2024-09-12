import {
	type App,
	type Editor,
	getAllTags,
	Menu,
	MetadataCache,
	MarkdownView,
	Modal,
	SuggestModal,
	Notice,
	Plugin,
	Vault,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	vaultTags: string[] | null;
	vaultLinks: string[] | null;

	async onload() {
		await this.loadSettings();

		this.vaultTags = this.getAllTags();
		// this.vaultLinks = Vault.getMarkdownFiles().map(p => p.file.name)
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// Add event listener for keydown events
		this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
			this.handleKeyPress(event);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
		);
	}

	onunload() {
		console.log("Autocomplete plugin unloaded");
	}

	getAllTags(): string[] {
		const tagSet = new Set<string>();

		// Get all files in the vault
		const files = this.app.vault.getMarkdownFiles();

		// Iterate through each file and get its cached metadata
		for (const file of files) {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);

			// Check if there are any tags in the metadata
			if (cachedMetadata && cachedMetadata.tags) {
				for (const tag of cachedMetadata.tags) {
					tagSet.add(tag.tag); // Add each tag to the set
				}
			}
		}

		return Array.from(tagSet);
	}

	handleKeyPress(event: KeyboardEvent) {
		if (event.key === "@") {
			this.showSuggestionsAtCursor();
		}
	}

	showSuggestionsAtCursor() {
		const selection = window.getSelection();

		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect(); // Get the cursor's bounding box

			// Show the suggestion menu at the cursor position
			this.showSuggestionMenu(rect.left, rect.bottom);
		}
	}

	showSuggestionMenu(x: number, y: number) {
		// Create a new suggestion menu using Obsidian's Menu API
		const menu = new Menu();
		console.log("vault tags: ", this.vaultTags);
		for (const tag of this.vaultTags ?? []) {
			menu.addItem((item) => {
				item.setTitle(tag).onClick(() => {
					console.log(`Selected tag #${tag}`);
				});
			});
		}

		// Display the menu at the cursor's position
		menu.showAtPosition({ x: x, y: y });
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
