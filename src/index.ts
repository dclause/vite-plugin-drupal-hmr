import { Plugin } from "vite";
import path, { dirname, join, relative } from "node:path";
import { existsSync } from "node:fs";
import type { DrupalHmrOptions, TwigUpdateData } from "./types";
import { TWIG_EVENT, TwigType } from "./constants";

const PLUGIN_NAME = "twig-hmr";
const VIRTUAL_NAME = `virtual:${PLUGIN_NAME}`;

const clientPath = path.resolve(__dirname, "./hmr.js");

/**
 * Returns the current theme path relative to Drupal root.
 * This relative path is built by traversing upwards from Vite base path until
 * the 'index.php' file is found along the 'core' folder.
 */
const detectThemePath = (root: string): string => {
  let current = root;

  while (current !== dirname(current)) {
    if (
      existsSync(join(current, "core")) &&
      existsSync(join(current, "index.php"))
    ) {
      return relative(current, root);
    }
    current = dirname(current);
  }

  return "";
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

    // --- RESOLVE OPTIONAL OPTIONS ---
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
      // Ignore node_modules
      // Support ts, jsx, tsx, and js
      // Inject only if not already present (safety check)
      if (id.includes("node_modules")) return;
      if (!/\.(js|mjs|ts|jsx|tsx)$/.test(id)) return;
      if (code.includes(VIRTUAL_NAME)) return;

      console.log(`[Drupal HMR] Injecting client into: ${id}`);
      return {
        code: `import '${VIRTUAL_NAME}';\n${code}`,
        map: null,
      };
    },

    // --- POINT TO REAL FILE ---
    resolveId(id) {
      if (id === VIRTUAL_NAME || id === `/${VIRTUAL_NAME}`) {
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
