import { Plugin } from "vite";
import path, { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { Event, TwigType, TwigUpdateData } from "./interface";

const PLUGIN_NAME = "twig-hmr";
// const VIRTUAL_NAME = `virtual:${PLUGIN_NAME}`;
// const VIRTUAL_OPTIONS_NAME = "virtual:drupal-hmr-options";

const RUNTIME_CLIENT_RUNTIME_PATH = "/@vite-plugin-drupal-template-hmr-runtime";
const RUNTIME_CLIENT_ENTRY_PATH = "/@vite-plugin-drupal-template-hmr";
const composePreambleCode = (options: DrupalHmrOptions) => `
import {doHMR} from "/${RUNTIME_CLIENT_RUNTIME_PATH.slice(1)}";
doHMR();
`;

// Get the current directory (standard ESM workaround for __dirname)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.resolve(__dirname, "./hmr.js");
const runtimeCode = `${fs.readFileSync(clientPath, "utf-8")};`;

/**
 * Define options users can pass to your plugin
 */
export type DrupalHmrOptions = {
  // A custom base path from your website root to your vite project root.
  // usually: /themes/custom/your-theme
  basePath?: string;
  themeName?: string;
};

/**
 * Returns the current theme path relative to Drupal root.
 * This relative path is built by traversing upwards from Vite base path until
 * the 'index.php' file is found along the 'core' folder.
 */
const detectDrupalBasePath = (root: string): string => {
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
  return file.match(new RegExp(`${ctx.basePath}/${TwigType.TEMPLATE}.*`))![0];
};

const getComponentId = (file: string, ctx: DrupalHmrOptions): string => {
  const templateName = path.parse(file).name;
  return `${ctx.themeName}:${templateName}`;
};

export default function viteDrupalHMR(options: DrupalHmrOptions = {}): Plugin {
  return {
    name: PLUGIN_NAME,
    apply: "serve",

    // Auto-detect the basePath option if not provided.
    configResolved(config) {
      options.basePath = options.basePath || detectDrupalBasePath(config.root);
      options.basePath = options.basePath.endsWith("/")
        ? options.basePath.slice(0, -1)
        : options.basePath;
      options.themeName =
        options.themeName || options.basePath.split("/").pop();
      console.log(`[Drupal HMR] Detected options: ${options}`);
    },

    // --- INJECT IMPORT ---
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: composePreambleCode(options),
        },
      ];
    },

    // --- POINT TO REAL FILE ---
    resolveId(id) {
      if (
        id === RUNTIME_CLIENT_RUNTIME_PATH ||
        id === RUNTIME_CLIENT_ENTRY_PATH
      ) {
        return id;
      }
    },

    load(id) {
      if (id === RUNTIME_CLIENT_RUNTIME_PATH) {
        return runtimeCode;
      }
      if (id === RUNTIME_CLIENT_ENTRY_PATH) {
        return composePreambleCode(options);
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
        event: Event.TWIG_UPDATE,
        data: {
          ...clientData,
          config: server.config,
        },
      });
    },
  };
}
