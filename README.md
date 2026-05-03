# Chromeless [![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](LICENSE)

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

## Source Code
On the other hand, **the source code is freely available** for use, modification and distribution under the permissions, limitations and conditions listed in the [Mozilla Public License 2.0](LICENSE).

---

## Development
Run:
```bash
# clone the project:
git clone https://github.com/kitsuyui/chromeless.git
cd chromeless

# install the dependencies
bun install

# run the app
bun run electron-dev

# Build for production
bun run dist
```
