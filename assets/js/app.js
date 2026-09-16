/**
 * Main JS entry point.
 *
 * Interaktyvumui (dropdown'ai, aktyvi navigacija, mobile toggle, sidebar
 * accordion) naudojamas Alpine.js — NE jQuery, NE Bootstrap JS bundle.
 * Smulkiems dalykams — paprastas vanilla JS tiesiogiai Alpine komponentuose
 * arba atskiruose moduliuose (importuojami čia pagal poreikį).
 */
import './../styles/main.scss';

import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';

import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

Alpine.plugin(collapse);

window.Alpine = Alpine;
window.Prism = Prism;

// Prism's line-numbers plugin measures each <pre>'s rendered height to
// place the gutter numbers, so it must run AFTER layout/fonts are ready,
// not just after DOMContentLoaded — a code panel that's still `x-show`
// hidden (display:none) at that point gets measured as 0-height and the
// numbers land wrong. Re-run highlighting once, on next tick, so any
// panel already visible on load is correct; panels revealed later via
// "Rodyti kodą" call `Prism.highlightAllUnder(...)` themselves (see the
// button page's inline `@click` handler).
window.addEventListener('load', () => {
    requestAnimationFrame(() => Prism.highlightAll());
});

/**
 * Global toast store — anything on any page can call
 * `Alpine.store('toasts').push('Nukopijuota: ...')` to queue a toast.
 * Rendered once in templates/partials/_toast-stack.html.twig (included in
 * base.html.twig), so it works site-wide, not just on the Colors page.
 *
 * Each toast carries its own `visible` flag driven by x-show, because
 * Alpine's x-transition only ever auto-fires through x-show/x-if — plain
 * x-for add/remove is NOT animated by Alpine (no transition hook in its
 * x-for implementation), so pushing/splicing `items` directly would make
 * toasts pop in/out instantly. Instead: push with visible:false, flip it
 * true a tick later (enter transition), and on removal flip it back to
 * false and only splice from `items` once BOTH the toast's own leave
 * fade (x-transition:leave, 180ms) and its wrapping .toast-slot's height
 * collapse (200ms, see _toast.scss) have had time to finish — otherwise
 * the DOM node disappears mid-animation and the remaining toasts snap
 * into place instead of sliding smoothly.
 */
const TOAST_LEAVE_MS = 220;

Alpine.store('toasts', {
    items: [],
    push(message) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.items.push({ id, message, visible: false });
        // Cap the stack so a rapid-click burst doesn't grow forever.
        if (this.items.length > 5) {
            this.remove(this.items[0].id);
        }
        // Alpine.nextTick (not requestAnimationFrame) — it waits for
        // Alpine's own reactivity flush, not the next paint, so the flip
        // still fires promptly even when the tab is backgrounded/not
        // actively rendering.
        Alpine.nextTick(() => {
            const toast = this.items.find((t) => t.id === id);
            if (toast) toast.visible = true;
        });
        setTimeout(() => this.remove(id), 3000);
    },
    remove(id) {
        const toast = this.items.find((t) => t.id === id);
        // `removing` (not `visible`) guards against double-removal — e.g.
        // the user clicks the close button and the 3s auto-dismiss timer
        // also fires — independent of whether the enter transition had
        // even finished yet.
        if (!toast || toast.removing) return;
        toast.removing = true;
        toast.visible = false;
        setTimeout(() => {
            this.items = this.items.filter((t) => t.id !== id);
        }, TOAST_LEAVE_MS);
    },
});

/**
 * Copies `text` to the clipboard and queues a success toast with `message`
 * (defaults to the copied text itself). Clipboard failure is swallowed —
 * the toast still fires so the UI doesn't silently do nothing.
 */
window.dsCopy = function dsCopy(text, message) {
    navigator.clipboard.writeText(text).catch(() => {});
    Alpine.store('toasts').push(message || `Nukopijuota: ${text}`);
};

/**
 * Experimental shell switcher (see the DialKit widget in
 * _dial-kit.html.twig and the flash-prevention inline script in
 * base.html.twig) — V.1 is the default, V.2 is Figma 5638:14930 (no
 * topbar, sidebar/content as floating rounded cards), V.3 is Figma
 * 5644:845 (topbar always visible, standard sidebar/content chrome,
 * edge-to-edge — matches V.1 visually apart from that), V.4 is V.3's
 * dark theme (see html.shell-v4 in _theme.scss). Persisted per-browser
 * so it survives navigating between the site's separate static pages.
 */
const DS_SHELL_VERSIONS = ['v1', 'v2', 'v3', 'v4'];

// A shared store, not per-component x-data — there's only one DialKit
// widget now (unlike the old per-shell duplicated switcher), but this
// still needs to be readable from anywhere (e.g. a future control could
// live in its own component) without re-deriving it from localStorage.
Alpine.store('shell', {
    current: (() => {
        try {
            return localStorage.getItem('ds-shell') || 'v1';
        } catch (e) {
            return 'v1';
        }
    })(),
});

window.dsSetShell = function dsSetShell(version) {
    DS_SHELL_VERSIONS.forEach((v) => document.documentElement.classList.remove(`shell-${v}`));
    if (version !== 'v1') document.documentElement.classList.add(`shell-${version}`);
    try {
        localStorage.setItem('ds-shell', version);
    } catch (e) {}
    Alpine.store('shell').current = version;
};

/**
 * Global "show code" toggle (DialKit widget, "Kodas" group) — controls
 * whether the per-component "Kodas" toggle button AND its code panel
 * render at all, site-wide, on every page/shell. Off means the block is
 * not just collapsed but absent next to the component entirely (see the
 * `x-show="... && $store.devTools.showCode"` bindings in buttons.html.twig).
 * Defaults to hidden (false) when nothing is saved yet.
 */
Alpine.store('devTools', {
    showCode: (() => {
        try {
            return localStorage.getItem('ds-show-code') === '1';
        } catch (e) {
            return false;
        }
    })(),
});

window.dsSetShowCode = function dsSetShowCode(value) {
    Alpine.store('devTools').showCode = value;
    try {
        localStorage.setItem('ds-show-code', value ? '1' : '0');
    } catch (e) {}
};

/**
 * Sidebar section expand/collapse state (see _sidebar.html.twig) — all
 * sections start expanded on a first visit (nothing in localStorage
 * yet), then whatever the user last left open/closed sticks on later
 * visits/page loads instead of always resetting back to all-expanded.
 */
window.dsSidebarState = function dsSidebarState() {
    const defaults = { foundations: true, components: true, patterns: true, pages: true };
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem('ds-sidebar-sections') || '{}');
    } catch (e) {}
    return {
        open: { ...defaults, ...saved },
        toggleSection(key) {
            this.open[key] = !this.open[key];
            try {
                localStorage.setItem('ds-sidebar-sections', JSON.stringify(this.open));
            } catch (e) {}
        },
    };
};

Alpine.start();
