#!/bin/sh -e

export MUTTER_DEBUG_DUMMY_MODE_SPECS=1366x768

dbus-run-session -- \
    gnome-shell --nested \
                --wayland