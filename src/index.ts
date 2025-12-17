import { Plugin } from "vite";
import path, { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const PLUGIN_NAME = "drupal-hmr";
const VIRTUAL_NAME = `virtual:${PLUGIN_NAME}`;
const VIRTUAL_OPTIONS_NAME = "virtual:drupal-hmr-options";

// Get the current directory (standard ESM workaround for __dirname)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.resolve(__dirname, "./client.js");

/**
 * Define options users can pass to your plugin
 */
export interface DrupalHmrOptions {
  // A custom base path from your website root to your vite project root.
  // usually: /themes/custom/your-theme
  basePath?: string;
}

/**
 * Returns the current theme path relative to Drupal root.
 *
 * This relative path is built by traversing upwards from Vite base path until
 * the 'index.php' file is found along the 'core' folder.
 */
function getRelativeDrupalPath(currentPath: string): string {
  let current = currentPath;
  const pathSegments: string[] = [];

  while (current !== dirname(current)) {
    if (
      existsSync(join(current, "core")) &&
      existsSync(join(current, "index.php"))
    ) {
      return pathSegments.join("/");
    }
    pathSegments.unshift(basename(current));
    current = dirname(current);
  }

  return pathSegments.join("/");
}

export default function viteDrupalHMR(options: DrupalHmrOptions = {}): Plugin {
  let initialized = false;

  return {
    name: PLUGIN_NAME,
    apply: "serve",

    // Auto-detect the basePath option if not provided.
    configResolved(config) {
      options.basePath = options.basePath || getRelativeDrupalPath(config.root);
      console.log(`[Drupal HMR] Detected basePath: ${options.basePath}`);
    },

    // --- INJECT IMPORT ---
    transform(code, id) {
      if (!initialized && /\.js$/.test(id)) {
        console.log(`[Twig HMR Plugin] Injecting client into: ${id}`);
        initialized = true;
        return {
          // Inject the import at the very top of the script
          code: `import '${VIRTUAL_NAME}';\n${code}`,
          map: null,
        };
      }
    },

    // --- POINT TO REAL FILE ---
    resolveId(id) {
      // Load the virtual module, proce
      if (id === VIRTUAL_NAME) {
        // Return the absolute path to the real file on disk.
        // Vite will load it, process TS if needed and serve it.
        return clientPath;
      }
      if (id === VIRTUAL_OPTIONS_NAME) {
        return "\0" + VIRTUAL_OPTIONS_NAME;
      }
    },

    load(id) {
      if (id === "\0" + VIRTUAL_OPTIONS_NAME) {
        return `export default ${JSON.stringify(options)}`;
      }
    },

    // --- SERVER SIDE ---
    handleHotUpdate({ file, server, read }) {
      if (file.endsWith(".twig")) {
        Promise.resolve(read()).then((content: string) => {
          server.ws.send({
            type: "custom",
            event: "custom:drupal-update",
            data: { file, content },
          });
        });
        return [];
      }
    },
  };
}
