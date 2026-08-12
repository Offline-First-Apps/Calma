/**
 * Local lint rules.
 *
 * Written by hand rather than pulled from a plugin because the one rule we
 * need is small, and a dependency that lints JSX would arrive with fifty
 * opinions we have not asked for.
 */

const EXEMPT_JSX_TEXT = /^[\s ]*$/;

/**
 * Flags literal text inside JSX.
 *
 * Every string in the product goes through `@calma/i18n`. A literal in a
 * component is a string that no translator will ever see, and — because tone
 * is reviewed against the JSON — one that no tone audit will catch either.
 */
const noLiteralJsxText = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow literal text in JSX. Every string goes through @calma/i18n.',
    },
    schema: [],
    messages: {
      literal:
        'Literal text in JSX: "{{text}}". Move it to a locale file and use t().',
    },
  },
  create(context) {
    return {
      JSXText(node) {
        if (EXEMPT_JSX_TEXT.test(node.value)) return;

        context.report({
          node,
          messageId: 'literal',
          data: { text: node.value.trim().slice(0, 40) },
        });
      },
      // `<Text>{'Breathe in'}</Text>` is the same offence wearing braces.
      JSXExpressionContainer(node) {
        const { expression, parent } = node;
        if (!parent || parent.type !== 'JSXElement') return;
        if (expression.type !== 'Literal') return;
        if (typeof expression.value !== 'string') return;
        if (EXEMPT_JSX_TEXT.test(expression.value)) return;

        context.report({
          node,
          messageId: 'literal',
          data: { text: expression.value.trim().slice(0, 40) },
        });
      },
    };
  },
};

export default {
  rules: {
    'no-literal-jsx-text': noLiteralJsxText,
  },
};
