# Chromeless [![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](LICENSE)

![Coverage](https://raw.githubusercontent.com/kitsuyui/octocov-central/main/badges/kitsuyui/chromeless/coverage.svg)
[![TODO/FIXME](https://raw.githubusercontent.com/kitsuyui/chromeless/gh-counter-assets/badges/maintenance-comments.svg)](https://github.com/kitsuyui/chromeless/search?q=%28TODO+OR+FIXME%29&type=code)
[![Type escape](https://raw.githubusercontent.com/kitsuyui/chromeless/gh-counter-assets/badges/type-escape.svg)](https://github.com/kitsuyui/chromeless/search?q=%28%22as+any%22+OR+%22%3A+any%22+OR+%22%40ts-ignore%22+OR+%22%40ts-expect-error%22%29&type=code)
[![Lint suppression](https://raw.githubusercontent.com/kitsuyui/chromeless/gh-counter-assets/badges/lint-suppression.svg)](https://github.com/kitsuyui/chromeless/search?q=%28eslint-disable+OR+biome-ignore%29&type=code)
[![Electron webPreferences](https://raw.githubusercontent.com/kitsuyui/chromeless/gh-counter-assets/badges/electron-web-preferences-risk.svg)](https://github.com/kitsuyui/chromeless/search?q=%28nodeIntegration%3A+true+OR+contextIsolation%3A+false%29&type=code)

|macOS|
|---|
|[![macOS](https://github.com/kitsuyui/chromeless/workflows/macOS/badge.svg)](https://github.com/kitsuyui/chromeless/actions?query=workflow:%22macOS%22)|

## Fork
This project is a maintained fork of [webcatalog/chromeless](https://github.com/webcatalog/chromeless), which is no longer actively developed upstream.

## Introduction
**Chromeless** is a free macOS app which lets you create Chromium-based or Firefox-based apps (also known as site-specific browsers) from any websites.

### How It Works
Chromeless is a free and open-source app for macOS that lets you create a site-specific browser (also known as Chromium-based app, chromeless app, etc) out of any website or web application, effectively turning your favorite web apps into self-contained, distraction-free desktop apps, all powered by your daily web browsers.

Supported Browser Engines:
- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Vivaldi
- Chromium
- Cốc Cốc
- Yandex Browser
- Mozilla Firefox

### Browser Instances
Chromeless also lets you create traditional browser instances (also known as tabbed-style apps) that behave just like normal browsers but with their own cookies and storage.

![Chromeless for Mac](build-resources/demos/screenshot-chromeless-app.png)
![Chromeless for Mac - App Mode](build-resources/demos/screenshot-chromeless-youtube.png)
![Chromeless for Mac - Browser Instance Mode](build-resources/demos/screenshot-chromeless-browser-instance.png)


---

## Installation

No pre-built binaries are currently available for this fork. To run Chromeless, build from source using the steps in the [Development](#development) section below.

---

## Source Code
On the other hand, **the source code is freely available** for use, modification and distribution under the permissions, limitations and conditions listed in the [Mozilla Public License 2.0](LICENSE).

---

## Development
Requirements:

- macOS
- Node.js 24.11.1 or newer
- Bun 1.3.13

Run:
```bash
# clone the project:
git clone https://github.com/kitsuyui/chromeless.git
cd chromeless

# install the dependencies
bun install

# run the app
bun run start

# run tests with coverage
bun run test

# Build for production
bun run dist
```

See [Maintenance Strategy](docs/maintenance.md) for the current quality gates and refactoring
policy.
