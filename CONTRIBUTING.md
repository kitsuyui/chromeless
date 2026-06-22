# Contributing to Chromeless

Thank you for your interest in contributing to Chromeless, a maintained fork of the original [webcatalog/chromeless](https://github.com/webcatalog/chromeless).

## Development Setup

```bash
git clone https://github.com/kitsuyui/chromeless.git
cd chromeless
bun install
bun run start
```

## Running Tests

```bash
bun run test
```

See [README.md](README.md) for the full build and development workflow.

## Submitting a Pull Request

1. Fork the repository and create a topic branch from `main`.
2. Make your changes with clear, focused commits.
3. Ensure `bun run test` passes.
4. Open a pull request against `main` using the provided template.

## Reporting Bugs

Use the bug report issue template. Include macOS version, browser engine, and steps to reproduce.

## Security Vulnerabilities

See [SECURITY.md](SECURITY.md) for the disclosure process. Do not open a public issue with exploit details.

## Code Style

This project uses [Biome](https://biomejs.dev/) for formatting and linting. Run:

```bash
bun run lint
bun run format
```

before submitting a PR.
