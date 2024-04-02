import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";

interface RatpoisonPluginSettings {
  enabled: boolean;
  showStatusBar: boolean;
  statusBarText: string;
}

const DEFAULT_SETTINGS: RatpoisonPluginSettings = {
  enabled: false,
  showStatusBar: true,
  statusBarText: "Ratpoison",
};

export default class RatpoisonPlugin extends Plugin {
  settings: RatpoisonPluginSettings;
  statusBar: HTMLElement;

  async onload() {
    this.addSettingTab(new RatpoisonSettingTab(this.app, this));

    this.addCommand({
      id: "toggle-active",
      name: "Toggle active",
      callback: async () => {
        this.settings.enabled = !this.settings.enabled;
        await this.saveSettings();
        await this.updateStatus();
      },
    });

    this.addCommand({
      id: "set-active",
      name: "Set active",
      callback: async () => {
        this.settings.enabled = true;
        await this.saveSettings();
        await this.updateStatus();
      },
    });

    this.addCommand({
      id: "set-inactive",
      name: "Set inactive",
      callback: async () => {
        this.settings.enabled = false;
        await this.saveSettings();
        await this.updateStatus();
      },
    });

    await this.loadSettings();
    await this.updateStatus();

    const statusBarItem = this.addStatusBarItem();
    this.statusBar = statusBarItem.createSpan();
    this.statusBar.addClass("ratpoison-status");

    this.registerInterval(
      window.setInterval(async () => {
        await this.updateStatus();
      }, 500)
    );
  }

  async onunload() {
    if (this.settings.enabled) {
      await this.restoreView();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onExternalSettingsChange() {
    this.updateStatus();
  }

  async updateStatus() {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView) {
      await this.restoreView();
      return;
    }

    this.statusBar.setText(this.settings.showStatusBar && this.settings.enabled ? this.settings.statusBarText : "");

    if (this.settings.enabled) {
      await this.setupView();
    } else {
      await this.restoreView();
    }
  }

  async setupView() {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (markdownView) {
      markdownView.containerEl.requestPointerLock();
    }
  }

  async restoreView() {
    document.exitPointerLock();
  }
}

class RatpoisonSettingTab extends PluginSettingTab {
  plugin: RatpoisonPlugin;

  constructor(app: App, plugin: RatpoisonPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Ratpoison enabled")
      .setDesc("Hides mouse pointer.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
          this.plugin.settings.enabled = value;
          await this.plugin.saveSettings();
          await this.plugin.updateStatus();
        })
      );

    new Setting(containerEl)
      .setName("Show state in status bar")
      .setDesc("Shows in the status bar when is active.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showStatusBar).onChange(async (value) => {
          this.plugin.settings.showStatusBar = value;
          await this.plugin.saveSettings();
          await this.plugin.updateStatus();
          this.display();
        })
      );

    if (this.plugin.settings.showStatusBar) {
      new Setting(containerEl)
        .setName("Text to show in status bar")
        .setDesc("Text to show in status bar when is active.")
        .addText((text) =>
          text.setValue(this.plugin.settings.statusBarText).onChange(async (value) => {
            this.plugin.settings.statusBarText = value;
            await this.plugin.saveSettings();
            await this.plugin.updateStatus();
          })
        );
    }
  }
}
