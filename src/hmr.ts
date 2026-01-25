import type { TemplateInfo, TemplatePair, TwigUpdateData } from "./types";
import { TWIG_EVENT, TwigType } from "./constants";

declare global {
  var __DRUPAL_HMR_INSTALLED__: boolean | undefined;
}

console.log("[Drupal HMR] Client handler initialized");

if (import.meta.hot && !globalThis.__DRUPAL_HMR_INSTALLED__) {
  globalThis.__DRUPAL_HMR_INSTALLED__ = true;

  if (!isTwigDevMode()) {
    throw new Error(
      "You have to setup twig dev mode in your Drupal install in order to make HMR work on template update.",
    );
  }

  import.meta.hot.on(TWIG_EVENT, async (ctx: TwigUpdateData) => {
    console.log(`[Drupal HMR] Update received for: ${ctx.file}`);

    try {
      await handleUpdate(ctx);
    } catch (e) {
      console.error("[Drupal HMR] Update failed", e);
      window.location.reload();
    }
  });

  import.meta.hot.accept();
}

async function handleUpdate(ctx: TwigUpdateData) {
  const response = await fetch(window.location.href);
  const domText = await response.text();

  const currentTemplates = findTemplateInHtml(
    document.documentElement.innerHTML,
    ctx,
  );
  const reloadedTemplates = findTemplateInHtml(domText, ctx);

  // Vérification de l'intégrité (Early return)
  if (
    currentTemplates.length === 0 ||
    currentTemplates.length !== reloadedTemplates.length
  ) {
    location.reload();
    return;
  }

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_COMMENT,
  );
  const comments = searchTemplateCommentList(walker, ctx);

  reloadedTemplates.forEach((match, i) => {
    replaceTemplate({
      templateId: ctx.templateId,
      template: match[1],
      comment: comments[i],
    });
  });
}

/**
 * Check if the Twig debug info are available on the current page.
 */
function isTwigDevMode(): boolean {
  return document.documentElement.innerHTML.includes("<!-- THEME DEBUG -->");
}

function replaceTemplate({
  templateId,
  template,
  comment,
}: TemplateInfo): void {
  const parent = comment.end.parentNode;
  if (!parent) return;

  // Delete between two comments
  const range = document.createRange();
  range.setStartAfter(comment.begin);
  range.setEndBefore(comment.end);
  range.deleteContents();

  // Insert new content
  const fragment = document.createRange().createContextualFragment(template);
  parent.insertBefore(fragment, comment.end);

  // Re-attach Drupal behaviors for the fragment.
  if (window.Drupal && window.Drupal.attachBehaviors) {
    window.Drupal.attachBehaviors(parent, window.drupalSettings);
  }

  // Send a custom event.
  const event = new CustomEvent("drupal-hmr:updated", {
    detail: {
      target: parent,
      templateId: templateId,
    },
    bubbles: true,
  });
  document.dispatchEvent(event);
}

function searchTemplateCommentList(
  walker: TreeWalker,
  ctx: TwigUpdateData,
): TemplatePair<Comment>[] {
  const tags = getCommentContent(ctx);
  if (!tags) return [];

  const list: TemplatePair<Comment>[] = [];
  let beginComment: Comment | null = null;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const commentData = transformTextIntoComment((node as Comment).data);
    const beginRegex = new RegExp(`^${tags.begin}$`, "u");
    const endRegex = new RegExp(`^${tags.end}$`, "u");

    if (beginRegex.test(commentData)) {
      beginComment = node as Comment;
    } else if (beginComment && endRegex.test(commentData)) {
      list.push({ begin: beginComment, end: node as Comment });
      beginComment = null;
    }
  }
  return list;
}

function findTemplateInHtml(html: string, ctx: TwigUpdateData) {
  const output = getCommentContent(ctx);
  if (!output) return [];

  // Use matchAll because the template can be used multiple times in the same page.
  const regexp = new RegExp(`${output.begin}(.*?)${output.end}`, "gmsu");
  return [...html.matchAll(regexp)];
}

function getCommentContent(
  ctx: TwigUpdateData,
): TemplatePair<string> | undefined {
  switch (ctx.templateType) {
    case TwigType.TEMPLATE:
      return {
        begin: `<!-- \\p{Emoji} BEGIN CUSTOM TEMPLATE OUTPUT from '${ctx.templateId}' -->`,
        end: `<!-- END CUSTOM TEMPLATE OUTPUT from '${ctx.templateId}' -->`,
      };
    case TwigType.COMPONENT:
      return {
        begin: `<!-- \\p{Emoji} Component start: ${ctx.templateId} -->`,
        end: `<!-- \\p{Emoji} Component end: ${ctx.templateId} -->`,
      };
  }
}

function transformTextIntoComment(text: string): string {
  return `<!--${text}-->`;
}
