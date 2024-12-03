import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MicIndicatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        const generalGroup = new Adw.PreferencesGroup({
            title: 'General Settings',
        });
        page.add(generalGroup);

        const virtualSourcesRow = new Adw.ActionRow({
            title: 'Show Virtual Sources',
            subtitle: 'Show the indicator for virtual audio sources',
        });
        const virtualSourcesToggle = new Gtk.Switch({
            active: settings.get_boolean('show-virtual-sources'),
            valign: Gtk.Align.CENTER,
        });
        virtualSourcesRow.add_suffix(virtualSourcesToggle);
        generalGroup.add(virtualSourcesRow);
        settings.bind(
            'show-virtual-sources',
            virtualSourcesToggle,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        const skippedAppsRow = new Adw.ActionRow({
            title: 'Skipped Applications',
            subtitle: 'Applications to ignore (comma-separated)',
        });
        const skippedAppsEntry = new Gtk.Entry({
            text: settings.get_strv('skipped-apps').join(','),
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });
        skippedAppsRow.add_suffix(skippedAppsEntry);
        generalGroup.add(skippedAppsRow);

        skippedAppsEntry.connect('changed', () => {
            const apps = skippedAppsEntry.text.split(',').map(app => app.trim()).filter(app => app);
            settings.set_strv('skipped-apps', apps);
        });

        window.add(page);
    }
}