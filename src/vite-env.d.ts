/// <reference types="vite/client" />

import type { Hot } from "vite/types/hot";

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: Hot;
}
