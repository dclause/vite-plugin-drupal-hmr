# Contributing to vite-plugin-drupal-hmr

Thank you for your interest in contributing. This document outlines the development workflow and technical standards for this plugin.

## Development Setup

### Prerequisites

- Node.js (Vite 6/7 compatible)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:

```shell
npm install
```

## Development Scripts

The project uses `tsup` for bundling and `eslint`/`prettier` for code quality.

- **Build**: `npm run build` generates the production distribution in the `dist` folder.
- **Watch Mode**: `npm run dev` starts `tsup` in watch mode for active development.
- **Linting & Formatting**: `npm run fix` runs Prettier and ESLint to ensure code consistency .

## Project Structure

- **src/index.ts**: Core Vite plugin logic (Node.js) handling hooks like `configResolved`, `transform`, and `handleHotUpdate` .
- **src/hmr.ts**: Browser-side HMR client that manages WebSocket events and DOM replacement .
- **src/constants.ts**: Shared constants and event definitions .
- **src/types.ts**: TypeScript interfaces and types .
- **tsup.config.ts**: Build configuration for hybrid CJS/ESM Node.js output and ESM browser output .

## Coding Standards

- **TypeScript**: All code must be strictly typed.
- **Linting**: Submissions must pass the project's ESLint and Prettier configurations .
- **Production Optimization**: Console logs are automatically stripped during the production build via `esbuildOptions`.
- **DOM Safety**: Browser-side logic uses `Range` and `TreeWalker` APIs for surgical DOM updates .

## Pull Request Process

1. Create a feature branch from the main branch.
2. Ensure the project builds successfully using `npm run build`.
3. Run `npm run fix` to verify linting and formatting compliance before committing .
4. Submit a Pull Request with a clear description of the changes.
