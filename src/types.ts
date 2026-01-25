import { TwigType } from "./constants";

/**
 * Add Drupal JS related structures types.
 */
declare global {
  interface Window {
    Drupal?: {
      attachBehaviors: (
        context: HTMLElement | Document,
        settings?: object,
      ) => void;
    };
    drupalSettings?: object;
  }
}

/**
 * Define options users can pass to your plugin.
 */
export interface DrupalHmrOptions {
  // (optional, auto-detected) A custom base path from drupal root to the vite project root.
  // usually: /themes/custom/your-theme
  themePath?: string;
  // (optional, auto-detected) The theme machine-name
  themeName?: string;
}

export interface TwigUpdateData {
  file: string;
  templateType: TwigType;
  templateId: string;
}

export interface TemplatePair<T> {
  begin: T;
  end: T;
}

export interface TemplateInfo {
  templateId: string;
  template: string;
  comment: TemplatePair<Comment>;
}
