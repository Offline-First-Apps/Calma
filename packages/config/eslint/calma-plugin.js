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


/**
 * Flags non-component exports from a `.tsx` file.
 *
 * `apps/native/vitest.config.ts` runs pure Node with no renderer, so anything
 * exported from a file containing JSX cannot be imported by a test without
 * dragging react-native through the transform. The standing rule is that
 * anything with a decision in it lives in a `.ts` module beside its component
 * — and the standing rule was broken twice in two sessions, by the person
 * writing it down:
 *
 *   - `dotColour` in `SudsTrail.tsx` (session 14)
 *   - `isReturning` in `useReturning.ts` (session 15)
 *
 * Both were only noticed when the test refused to load. That is a slow way to
 * find out, and it happens after the code is written rather than while it is
 * being written. This is the same rule, enforced at the point of the mistake.
 *
 * A "component" here is an exported function whose name is PascalCase. Hooks
 * (`useThing`) are allowed too: a hook cannot be tested in Node either, so
 * moving it would not help — the pure part it calls is what belongs elsewhere.
 */
const NAMED_LIKE_COMPONENT = /^[A-Z]/;
const NAMED_LIKE_HOOK = /^use[A-Z]/;

function isAllowedExportName(name) {
  return NAMED_LIKE_COMPONENT.test(name) || NAMED_LIKE_HOOK.test(name);
}

const noLogicInComponentFiles = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow non-component exports from .tsx files, so pure logic stays testable in Node.',
    },
    schema: [],
    messages: {
      moveIt:
        '"{{name}}" is exported from a .tsx file, so no Node test can import it. ' +
        'Move it to a .ts module beside this one.',
    },
  },
  create(context) {
    function check(node, name) {
      if (name === undefined || isAllowedExportName(name)) return;
      context.report({ node, messageId: 'moveIt', data: { name } });
    }

    return {
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        if (!declaration) return;

        if (declaration.type === 'FunctionDeclaration') {
          check(declaration, declaration.id?.name);
          return;
        }

        if (declaration.type === 'VariableDeclaration') {
          for (const declarator of declaration.declarations) {
            // Only functions. An exported constant is a value, not logic,
            // and moving `const DOT_SIZE = 13` would be busywork.
            const init = declarator.init;
            const isFunction =
              init &&
              (init.type === 'ArrowFunctionExpression' ||
                init.type === 'FunctionExpression');
            if (!isFunction) continue;
            if (declarator.id.type !== 'Identifier') continue;
            check(declarator, declarator.id.name);
          }
        }
      },
    };
  },
};

export default {
  rules: {
    'no-literal-jsx-text': noLiteralJsxText,
    'no-logic-in-component-files': noLogicInComponentFiles,
  },
};
