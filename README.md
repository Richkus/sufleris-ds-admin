# Mokesčių Sufleris DS — Admin scaffold

Statinis "Design System admin section" build pipeline'as, sukurtas naudojant
kliento realų produkcinį stack'ą (Twig + SCSS/Bootstrap 5 per Webpack Encore +
Alpine.js), kad vėliau būtų lengvai integruojamas atgal į tikrą produktą.

Šiame etape **dizaino turinio dar nėra** — tik infrastruktūra:

- **Twig** šablonai (`templates/`) kompiliuojami į statinį HTML per
  `scripts/render-twig.js` (naudojant `twing`).
- **SCSS + Bootstrap 5** stiliai (`assets/styles/`), sudėliojami per Webpack
  Encore. Visi spalvų/tarpų tokenai — `assets/styles/_variables.scss`.
- **Alpine.js** interaktyvumui (ne jQuery).
- Sugeneruotas rezultatas atsiduria `public/` kataloge (negrafuojamas į git).

## Paleidimas

```bash
npm install
```

### Dev (vienkartinis build)

```bash
npm run dev
```

### Watch (automatinis perkompiliavimas keičiant failus)

```bash
npm run watch
```

### Production build

```bash
npm run build
```

Kiekviena komanda pirmiausia sugeneruoja HTML iš Twig šablonų
(`npm run render`), tada paleidžia Webpack Encore SCSS/JS kompiliavimui.
Rezultatas: `public/index.html` + `public/build/app.css` / `public/build/app.js`.
