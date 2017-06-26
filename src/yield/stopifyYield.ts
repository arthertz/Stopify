const noArrows = require('babel-plugin-transform-es2015-arrow-functions');

import { stopifyFunction, stopifyPrint } from '../interfaces/stopifyInterface'
import * as desugarNew from '../common/desugarNew';
import * as makeBlockStmt from '../common/makeBlockStmt';
import * as yieldPass from './yield';
import * as transformMarked from '../common/transformMarked';
import { transform } from '../common/helpers';
import * as markKnown from '../common/markKnownFunctions'
import * as renameC from './renameConstructor'
import * as pAssign from './prototypeAssign'
import * as nameMCall from './nameMethodCall'

// The runtime needs to be stored as a string to allow for client-side
// compilation.

const yieldRuntime = `
/*
 * The runtime is wrapped in a funtion:
 * function($isStop, $onStop, $onDone, $interval).
 * The output of the yield transform expects $counter to be defined.
 */
const $yieldCounter = $interval;
let $counter = 0;
function $mark_func(f) {
  f.$isTransformed = true;
  return f;
};

function $runYield(gen, res = { done: false, value: undefined }) {
  setTimeout(_ => {
    if ($isStop()) {
      return $onStop();
    }
    res = gen.next();
    if (res.done) {
      return $onDone(res.value);
    }
    else {
      return $runYield(gen, res);
    }
  }, 0)
};
`

export const yieldStopifyPrint: stopifyPrint = (code) => {
  const plugins = [
    [noArrows, desugarNew, renameC, pAssign, nameMCall],
    [makeBlockStmt], [markKnown], [yieldPass],
    [transformMarked]
  ];
  const transformed = transform(code, plugins);

  if(transformed.length < code.length) {
    throw new Error('Transformed code is smaller than original code')
  }

  return `
  function $stopifiedProg($isStop, $onStop, $onDone, $interval) {
    ${yieldRuntime}
    ${transformed}
  }
  `
}

export const yieldStopify: stopifyFunction = (code) => {
  return eval(`
    (function() {
      return (${yieldStopifyPrint(code)});
    })()
  `)
}