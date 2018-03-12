import * as babel from 'babel-core';
import * as t from 'babel-types';
import { NodePath } from 'babel-traverse';

export const runtimePath = 'stopify-continuations/dist/src/runtime';

export type FunctionNode =
  t.FunctionDeclaration | t.FunctionExpression | t.ObjectMethod;

// Helper to generate tagging function for AST tags preserved between traversals.
export function tag<T, V>(tag: string, t: T, v: V) {
  type S<T> = T & {
    [tag: string]: V
  };
  const tagged = <S<T>>t;
  tagged[tag] = v;
  return tagged;
}

export type StopifyAnnotation = '@stopify flat';

export function isStopifyAnnotation(v: string): v is StopifyAnnotation {
  return /^@stopify flat$/.test(v);
}

export type FlatTag = 'NotFlat' | 'Flat';

export type FlatnessMark<T> = T & {
  mark: FlatTag
};

// Used for marking known transformed functions
export type Tag = 'Transformed' | 'Untransformed' | 'Unknown';

export type Break<T> = T & {
  break_label?: t.Identifier;
};
export type While<T> = T & {
  continue_label?: t.Identifier;
};
// Mark a node as transformed. Used by the transformMarked transform.
export type Transformed<T> = T & {
  isTransformed?: boolean
};
export type KArg<T> = T & {
  kArg: t.Identifier;
};
export type NewTag<T> = T & {
  new: boolean
};

const breakLbl = <T>(t: T, v: t.Identifier) => tag('break_label', t, v);
const continueLbl = <T>(t: T, v: t.Identifier) => tag('continue_label', t, v);
const transformed = <T>(t: T) => tag('isTransformed', t, true);
const kArg = <T>(t: T, v: t.Identifier) => tag('kArg', t, v);
const newTag = <T>(t: T) => tag('new', t, true);

const containsCallVisitor = {
  FunctionExpression(path: NodePath<t.FunctionExpression>): void {
    path.skip();
  },

  CallExpression(path: NodePath<FlatnessMark<t.CallExpression>>) {
    if (path.node.mark == 'Flat') return;
    this.containsCall = true;
    path.stop();
  },

  NewExpression(path: NodePath<t.NewExpression>): void {
    this.containsCall = true;
    path.stop();
  },
};

/**
 * Traverses children of `path` and returns true if it contains any applications.
 */
export function containsCall<T>(path: NodePath<T>) {
  let o = { containsCall: false };
  path.traverse(containsCallVisitor, o);
  return o.containsCall;
}

export type kind = 'const' | 'var' | 'let' | undefined;
function letExpression(name: t.LVal,
  value: t.Expression,
  kind: kind = 'let'): t.VariableDeclaration {
    return t.variableDeclaration(kind, [t.variableDeclarator(name, value)]);
  }

/**
 * Use this when the contents of the body need to be flattened.
 * @param body An array of statements
 * @returns a new block (does not update the argument)
 */
function flatBodyStatement(body: t.Statement[]): t.BlockStatement {
  const newBody : t.Statement[] = [];
  body.forEach((elem) => {
    if (t.isBlockStatement(elem)) {
      elem.body.forEach((e) => {
        if (t.isStatement(e)) newBody.push(e);
        else if (t.isEmptyStatement(e)) { } else {
          throw new Error(
            'Could not flatten body, element was not a statement');
        }
      });
    } else newBody.push(elem);
  });

  return t.blockStatement(newBody);
}

/**
 * A simple wrapper around Babel's `transformFromAst` function.
 */
function transformFromAst(
  path: NodePath<t.Node>,
  plugins: any[],
  ast = false,
  code = false): babel.BabelFileResult {
  const opts: babel.TransformOptions = {
    plugins: plugins,
    babelrc: false,
    code: false,
    ast: false,
  };
  return babel.transformFromAst(path.node, undefined, opts);
}


export {
  transformFromAst,
  transformed,
  breakLbl,
  continueLbl,
  kArg,
  newTag,
  letExpression,
  flatBodyStatement,
};

