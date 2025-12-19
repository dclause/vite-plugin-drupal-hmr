// // @ts-expect-error Virtual module handled by plugin
// import options from "virtual:drupal-hmr-options";
import {
  Event,
  TemplateInfo,
  TemplatePair,
  TwigType,
  TwigUpdateData,
} from "./interface";

console.log("[Drupal HMR] Client handler initialized");

/**
 * Check if the Twig debug info are available on the current page.
 */
const isTwigDevMode = () => {
  const currentHtml = document.documentElement.innerHTML;
  const found = currentHtml.match("<!-- THEME DEBUG -->");
  return found !== null && found.length > 0;
};

if (import.meta.hot) {
  if (!isTwigDevMode()) {
    throw new Error(
      "You have to setup twig dev mode in your Drupal install in order to make HMR work on template update.",
    );
  }

  import.meta.hot.on(Event.TWIG_UPDATE, async (ctx: TwigUpdateData) => {
    console.log(`[Drupal HMR] Update received for: ${ctx.file}`);

    const currentHtml = document.documentElement.innerHTML;
    const url = new URL(window.location.href);
    const response = await fetch(url);
    const dom = await response.text();
    const currentHtmlTemplateList = findTemplateInHtml(currentHtml, ctx);
    const reloadedHtmlTemplateList = findTemplateInHtml(dom, ctx);

    if (
      currentHtmlTemplateList.length <= 0 ||
      reloadedHtmlTemplateList.length <= 0 ||
      currentHtmlTemplateList.length !== reloadedHtmlTemplateList.length
    ) {
      location.reload();
      return;
    }

    const commentWalker = document.createTreeWalker(
      document.querySelector("body")!,
      NodeFilter.SHOW_COMMENT,
      null,
    );
    const templateCommentList: TemplatePair<Comment>[] =
      searchTemplateCommentList(commentWalker, ctx);

    reloadedHtmlTemplateList.forEach((htmlTemplate, index) => {
      const templateInfo = {
        template: htmlTemplate[0],
        comment: templateCommentList[index],
      };
      replaceTemplate(templateInfo);
    });
  });
}

const replaceTemplate = ({ template, comment }: TemplateInfo): void => {
  const toBeRemoved: ChildNode[] = [];
  let node: Node | null = comment.begin.nextSibling;

  while (node) {
    if (
      node.nodeType === Node.COMMENT_NODE &&
      (node as Comment).data === comment.end.data
    ) {
      break;
    }
    toBeRemoved.push(node as ChildNode);
    node = node.nextSibling;
  }

  toBeRemoved.forEach((node) => node.remove());

  const parser = new DOMParser();
  const doc = parser.parseFromString(template, "text/html");
  const parent = comment.end.parentNode;

  if (!parent) return;

  [...doc.body.childNodes]
    .filter((n) => n.nodeType !== Node.COMMENT_NODE)
    .forEach((n) => parent.insertBefore(n, comment.end));
};

const searchTemplateCommentList = (
  walker: TreeWalker,
  ctx: TwigUpdateData,
): TemplatePair<Comment>[] => {
  const output = getCommentContent(ctx);
  if (!output) return [];

  let end = false;
  let beginComment = undefined;
  const list = [];

  while (!end) {
    const node = walker.nextNode();

    if (node === null) {
      end = true;
    } else if (
      transformTextIntoComment((node as Comment).data) === output.begin
    ) {
      beginComment = node;
    } else if (
      beginComment instanceof Node &&
      transformTextIntoComment((node as Comment).data) === output.end
    ) {
      list.push({
        begin: beginComment as Comment,
        end: node as Comment,
      });
      beginComment = undefined;
    }
  }

  return list;
};

const findTemplateInHtml = (html: string, ctx: TwigUpdateData) => {
  const output = getCommentContent(ctx);
  if (!output) {
    return [];
  }
  // Use matchAll because the template can be used multiple times in the same page.
  const regexp = new RegExp(`${output.begin}.*?${output.end}`, "gmsd");

  return [...html.matchAll(regexp)];
};

const getCommentContent = (
  ctx: TwigUpdateData,
): TemplatePair<string> | undefined => {
  switch (ctx.templateType) {
    case TwigType.TEMPLATE:
      return {
        begin: `<!-- 💡 BEGIN CUSTOM TEMPLATE OUTPUT from '${ctx.templateId}' -->`,
        end: `<!-- END CUSTOM TEMPLATE OUTPUT from '${ctx.templateId}' -->`,
      };
    case TwigType.COMPONENT:
      return {
        begin: `<!-- 🥚 Component start: ${ctx.templateId} -->`,
        end: `<!-- 🥚 Component end: ${ctx.templateId} -->`,
      };
  }
};

const transformTextIntoComment = (text: string): string => {
  return `<!--${text}-->`;
};
