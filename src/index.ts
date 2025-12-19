import { Plugin } from "vite";
import path, { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import type { DrupalHmrOptions, TwigUpdateData } from "./types";
import { TWIG_EVENT, TwigType } from "./constants";

const PLUGIN_NAME = "twig-hmr";
const VIRTUAL_NAME = `virtual:${PLUGIN_NAME}`;

// Get the current directory (standard ESM workaround for __dirname)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.resolve(__dirname, "./hmr.js");

/**
 * Returns the current theme path relative to Drupal root.
 * This relative path is built by traversing upwards from Vite base path until
 * the 'index.php' file is found along the 'core' folder.
 */
const detectThemePath = (root: string): string => {
  let current = root;
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
};

const getTemplateId = (file: string, ctx: DrupalHmrOptions): string => {
  return file.match(new RegExp(`${ctx.themePath}/${TwigType.TEMPLATE}.*`))![0];
};

const getComponentId = (file: string, ctx: DrupalHmrOptions): string => {
  const templateName = path.parse(file).name;
  return `${ctx.themeName}:${templateName}`;
};

export default function viteDrupalHMR(options: DrupalHmrOptions = {}): Plugin {
  return {
    name: PLUGIN_NAME,
    apply: "serve",

    // Auto-detect the themePath option if not provided.
    configResolved(config) {
      options.themePath = options.themePath || detectThemePath(config.root);
      options.themePath = options.themePath.endsWith("/")
        ? options.themePath.slice(0, -1)
        : options.themePath;
      options.themeName =
        options.themeName || options.themePath.split("/").pop();
      console.log(`[Drupal HMR] Detected options: ${options}`);
    },

    // --- INJECT IMPORT ---
    transform(code, id) {
      if (/\.js$/.test(id)) {
        console.log(`[Drupal HMR] Injecting client into: ${id}`);
        return {
          // Inject the import at the very top of the script
          code: `import '${VIRTUAL_NAME}';\n${code}`,
          map: null,
        };
      }
      return code;
    },

    // --- POINT TO REAL FILE ---
    resolveId(id) {
      // Load the virtual module, proce
      if (id === VIRTUAL_NAME || id === `/${VIRTUAL_NAME}`) {
        // Return the absolute path to the real file on disk.
        // Vite will load it, process TS if needed and serve it.
        return clientPath;
      }
    },

    // --- SERVER SIDE ---
    handleHotUpdate({ file, server }) {
      if (!file.endsWith(".twig")) return;

      const clientData: TwigUpdateData = {
        file,
        templateType: TwigType.OTHER,
        templateId: "",
      };

      if (file.includes(TwigType.TEMPLATE)) {
        clientData.templateType = TwigType.TEMPLATE;
        clientData.templateId = getTemplateId(file, options);
      } else if (file.includes(TwigType.COMPONENT)) {
        clientData.templateType = TwigType.COMPONENT;
        clientData.templateId = getComponentId(file, options);
      }

      server.ws.send({
        type: "custom",
        event: TWIG_EVENT,
        data: {
          ...clientData,
          config: server.config,
        },
      });
    },
  };
}
