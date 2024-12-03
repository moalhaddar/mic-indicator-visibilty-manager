import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi://GLib'


/**
 * You may be looking at this and wondering why i'm not using GVC?
 * Multiple reasons:
 *  - It doesn't allow me to access the source outputs properties
 *  - The is_virtual function for MixerStream is not based on node.virtual property for 
 *  some reason
 * 
 * The easiest way i found was to call pactl from the cli and call it a day, i guess a 
 * dbus implementation is possible too, but i'm too lazy for that.
 */
function getSourceOutputsFromCLI() {
    let [success, stdout] = GLib.spawn_command_line_sync('pactl list source-outputs');
    if (!success) {
        throw new Error("Failed to call 'pactl' from cli. Is 'pactl' installed?")
        return [];
    }

    const output = new TextDecoder().decode(stdout);

    let sourceOutputs = [];
    let sections = output.split('Source Output #');

    // Skip first empty section
    sections.shift();

    for (let section of sections) {
        let lines = section.split('\n');
        let sourceOutput = {
            index: null,
            properties: {},
            volume: null,
            mute: null,
            source: null
        };

        sourceOutput.index = parseInt(lines[0].trim());

        let currentCategory = null;
        
        for (let line of lines) {
            line = line.trim();
            
            if (!line) continue;

            if (line.includes('Volume:')) {
                currentCategory = 'volume';
                sourceOutput.volume = line.split('Volume:')[1].trim();
                continue;
            }
            if (line.includes('Mute:')) {
                sourceOutput.mute = line.includes('yes');
                continue;
            }
            if (line.includes('Source:')) {
                sourceOutput.source = line.split('Source:')[1].trim();
                continue;
            }
            if (line === 'Properties:') {
                currentCategory = 'properties';
                continue;
            }

            if (currentCategory === 'properties' && line.includes(' = ')) {
                let [key, ...valueParts] = line.split(' = ');
                let value = valueParts.join(' = ').replace(/"/g, '');
                sourceOutput.properties[key.trim()] = value.trim();
            }
        }

        sourceOutputs.push(sourceOutput);
    }

    return sourceOutputs;
}


export default class MicIndicatorVisibilityManagerExtension extends Extension {

    input;
    originalMaybeShowInput;

    enable() {
        this.input = Main.panel.statusArea.quickSettings._volumeInput._input;

        this.originalMaybeShowInput = this.input._maybeShowInput

        this.input._maybeShowInput = (function() {
            let showInput = false;
            if (this._stream) {
                const skippedApps = [
                    'org.gnome.VolumeControl',
                    'org.PulseAudio.pavucontrol',
                ];

                const sourceOutputs = getSourceOutputsFromCLI()
                const sourceOutputsFiltered = sourceOutputs
                    .filter(output => output.properties['node.virtual'] !== 'true')
                    .filter(output => !skippedApps.includes(output.properties['application.id']))

                showInput = sourceOutputsFiltered.length > 0;
            }

            this._showInput = showInput;
            this._sync();
        }).bind(this.input);

        this.input._maybeShowInput();

        console.log("Enabled Mic Indicator")
    }

    disable() {

        this.input._maybeShowInput = this.originalMaybeShowInput;
        this.input._maybeShowInput();

        console.log("Disabled Mic Indicator")
    }
}
