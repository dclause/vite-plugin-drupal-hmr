# vite-plugin-drupal-hmr

A Vite plugin providing seamless Hot Module Replacement (HMR) for Twig files within Drupal development workflows.

## Features

- **Twig HMR:** Update templates without a full page refresh.
- **SDC Support:** Fully compatible with [Single-Directory Components](<(https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components)>).
- **Canvas Integration:** Works with Drupal [Canvas](https://www.drupal.org/project/canvas) pages.
- **Zero-Config Detection:** Automatically detects theme names and paths relative to the Drupal root.
- **Vite Dev Server:** The plugin is only active during serve mode.

## Requirements

- **Twig Debug Mode:** Must be enabled in Drupal's `services.yml` ([_lean how_](<(https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal/debugging-twig-templates#s-enable-twig-debug-mode)>)).
- **Vite Client:** The `/@vite/client` endpoint must be loaded in your Drupal pages. The easiest way to do this is to use the [Drupal Vite module](https://www.drupal.org/project/vite).

## Installation

```shell
npm install -D vite-plugin-drupal-hmr
```

## Usage

Add the plugin to your `vite.config.ts`:

```js
import { defineConfig } from "vite";
import viteDrupalHMR from "vite-plugin-drupal-hmr";

export default defineConfig({
  plugins: [
    viteDrupalHMR({
      // Optional options
    }),
  ],
});
```

## Configuration Options

| Option    | Type   | Description                                                                                                        |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| themePath | string | **Optional:** Relative path from Drupal root to the Vite project root<br/>(e.g., /themes/custom/your-theme).       |
| themeName | string | **Optional:** The machine name of your theme.<br/>Auto-detected from the themePath directory name if not provided. |

## Limitations

- **Existing Elements Only:** Can only perform HMR on templates already rendered on the current page load.
- **Discovery:** Adding a new Twig template or using a previously unused template requires a full page reload.

## Technical Overview

The plugin leverages the Vite `handleHotUpdate` hook to detect `.twig` file changes.

1. **Server-side:** The plugin identifies if the changed file is a standard template or an SDC component. It then broadcasts a message via Vite's WebSocket server.
2. **Client-side:** An injected script intercepts the update event, performs an asynchronous `fetch` of the current URL, and extracts the new HTML fragment by matching the Twig debug comments.
3. **Replacement:** It uses the browser's DOM `Range` API to replace the old template content with the newly fetched fragment without losing the global application state.
