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
 * false and only splice from `items` once the leave transition (see the
 * duration below and the template's matching x-transition:leave) has had
 * time to finish, so the DOM node never disappears mid-fade.
 */
const TOAST_LEAVE_MS = 180;

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

Alpine.start();
