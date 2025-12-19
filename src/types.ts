import { TwigType } from "./constants";

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
  template: string;
  comment: TemplatePair<Comment>;
}
