# vite-plugin-drupal-hmr

A Vite plugin designed to seamlessly integrate Hot Module Replacement (HMR) for _twig_ files
into your Drupal theming development workflow 🪄.

Works both for Twig files from [Drupal twig theming](https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal)
and
from [Single-Directory Components](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components)
templates... and integrates with the new [Canvas](https://www.drupal.org/project/canvas) pages 🎉.

## Limitations

- Only works
  with [Twig debug enabled](https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal/debugging-twig-templates#s-enable-twig-debug-mode).
- Re-uses the [Vite dev server](https://vite.dev/guide/cli.html#dev-server), so the `/@vite/client` endpoint must be
  loaded in your pages (see Usage below).
- Can only perform HMR on templates that were rendered on the current page load. Discovering new or unused Twig
  templates still requires a full page reload.

## Usage

1. This plugin will only be active when the Vite [dev server](https://vitejs.dev/guide/cli.html#dev-server) is used.
2. To use this plugin, you need to have a valid setup with Vite and Drupal.
   You can use modules like https://www.drupal.org/project/vite to help you do that.
3. Install it as you would install any `npm` package. Example:

```shell
npm install -D vite-plugin-drupal-hmr
```

4. Reference the plugin in your `vite.config.ts` file.

```js
// Example Full vite.config.ts (using a standard Drupal path)
import {defineConfig} from "vite"; // Make sure to show the import for defineConfig
import viteDrupalHMR from "vite-plugin-drupal-hmr";

export default defineConfig({
    plugins: [
        // ...other plugins
        viteDrupalHMR({
            /* options */
        }),
    ],
    // ...other necessary Vite configuration (like server block for proxying)
});
```

## Options

```ts
/**
 * Define options users can pass to your plugin.
 */
export type DrupalHmrOptions = {
    // (optional, auto-detected) A custom base path from drupal root to the vite project root.
    // usually: /themes/custom/your-theme
    themePath?: string;
    // (optional, auto-detected) The theme machine-name
    themeName?: string;
};
```

## How it works

This plugin is leveraging Vite [HMR API](https://vitejs.dev/guide/api-hmr.html#hmr-api)
and Drupal `twig.config` with active `debug` mode in order to hot reload parts of the page when
a template is updated.

This plugin uses Vite hook `handleHotUpdate` and
[Virtual Modules](https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention) to load some HMR client code on
the website.

When a twig file changes, the module will perform a `fetch` on the current URL to catch the updated HTML of the page and
do DOM manipulations to replace the HTML between the twig suggestion comments added by the `twig debug mode`.
