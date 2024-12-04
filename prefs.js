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

        const ignoredPropsGroup = new Adw.PreferencesGroup({
            title: 'Ignored Properties',
            description: 'Enter property:value pairs to ignore (one per line)\nExample: node.name:MyMic',
        });
        page.add(ignoredPropsGroup);

        const scrolledWindow = new Gtk.ScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            min_content_height: 100,
            max_content_height: 200,
        });

        const textView = new Gtk.TextView({
            wrap_mode: Gtk.WrapMode.WORD_CHAR,
            monospace: true,
        });
        
        const buffer = textView.get_buffer();
        buffer.set_text(settings.get_strv('ignored-properties').join('\n'), -1);
        
        scrolledWindow.set_child(textView);
        ignoredPropsGroup.add(scrolledWindow);

        buffer.connect('changed', () => {
            const [start, end] = buffer.get_bounds();
            const text = buffer.get_text(start, end, false);
            const properties = text.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.includes(':'));
            settings.set_strv('ignored-properties', properties);
        });

        window.add(page);
    }
}