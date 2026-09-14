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

window.Alpine = Alpine;

Alpine.start();
