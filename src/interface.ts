export enum Event {
  TWIG_UPDATE = "custom:twig-update",
}

export enum TwigType {
  TEMPLATE = "templates/",
  COMPONENT = "components/",
  OTHER = "",
}

export type TwigUpdateData = {
  file: string;
  templateType: TwigType;
  templateId: string;
};

export type TemplatePair<T> = {
  begin: T;
  end: T;
};

export type TemplateInfo = {
  template: string;
  comment: TemplatePair<Comment>;
};
