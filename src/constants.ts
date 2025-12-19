export const TWIG_EVENT = "custom:twig-update";
export const TwigType = {
  TEMPLATE: "templates/" as const,
  COMPONENT: "components/" as const,
  OTHER: "" as const,
};

export type TwigType = (typeof TwigType)[keyof typeof TwigType];
