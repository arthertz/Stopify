/**
 * Command-line to compile continuations.
 */
import * as commander from 'commander';
import { CompilerOpts } from '../types';
import { checkAndFillCompilerOpts } from './check-compiler-opts';

commander.option(
  '-t, --transform <transformation>',
  'either eager, lazy, catch, retval, original, or fudge');

commander.option(
  '-n, --new <new>',
  'either direct or wrapper');

commander.option(
  '--es <mode>',
  'either sane or es5 (default: sane)');

commander.option(
  '--eval',
  'Support eval');

commander.option(
  '--js-args <mode>',
  'either simple, faithful, or full (default: simple)');

commander.option(
  '--getters',
  'enable support for getters/setters (default: false)');

commander.option('--require-runtime',
  `use require('stopify') to load the runtime system, which necessary to run
   on Node`);

commander.option(
  '--debug',
  'Insert suspensions between every line of code in the source program');

commander.option(
  '--stack-size <size>',
  'Maximum number of stack frames allowed in the runtime stack. Ignored if the runtime does not support deep stacks (default: Infinity)');

commander.option(
  '--restore-frames <size>',
  'Number of frames to be restored onto the JS stack after a stack save. A constant implies deep stacks. Infinity implies shallow stacks. (default: Infinity)');

commander.option(
  '--func',
  'Compile a top-level function. Doesnt add runtime initialization or cleanup');
commander.option('--compile-mode <mode>',
  `either normal or library (default: normal)`);

commander.arguments('<srcPath> <dstPath>');
const args = commander.parse(process.argv);

export const compilerOpts: CompilerOpts = checkAndFillCompilerOpts({
  compileFunction: args.func,
  getters: args.getters,
  debug: args.debug,
  captureMethod: args.transform,
  newMethod: args.new,
  es: args.es,
  compileMode: args.compileMode,
  jsArgs: args.jsArgs,
  requireRuntime: args.requireRuntime,
  stackSize: args.stackSize,
  restoreFrames: args.restoreFrames
});

const srcPath: string = args.args[0];
const dstPath: string = args.args[1];

if (!srcPath || !dstPath) {
  throw new Error('<srcPath> or <dstPath> is required');
}

export { srcPath, dstPath };
