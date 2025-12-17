// @ts-expect-error Virtual module handled by plugin
import options from "virtual:drupal-hmr-options";

console.log("[Drupal HMR] Client handler initialized");
console.log("[Drupal HMR] Options received:", options);

export interface TwigUpdateData {
  file: string;
  content?: string;
  timestamp: number;
}

if (import.meta.hot) {
  import.meta.hot.on("custom:twig-update", (data: TwigUpdateData) => {
    console.log(`[Drupal HMR] Update received for: ${data.file}`);
  });
}
