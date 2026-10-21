/*
  The one loader every test here uses. A TypeScript module from src/ is
  transpiled with the `typescript` package already in devDependencies and run
  inside a vm with its imports replaced by the fakes a test hands in, so a
  route or data module runs for real while nothing reaches Resend, a
  Scooplist feed, or the network. No test runner dependency: node:test.

    import { load } from "./_load.mjs";
    const mod = load("src/app/api/inquiry/route.ts", { mocks, env, globals });

  `mocks` maps an import specifier to what require() returns for it; any
  specifier not in the map throws, so a module cannot quietly reach a real
  dependency. `env` is process.env inside the module. `globals` are added to
  the vm (a fake fetch, a captured console).

  One trap: arrays and objects the module creates belong to the vm's realm,
  so assert.deepStrictEqual against a literal fails on the prototype even
  when the contents match. Spread them first: deepEqual([...got], [...]).

  ES modules, because the repo lint forbids require(). Pattern salvaged from hershock48/truenorth#1 and #7; the tests themselves
  are written against what main actually does.
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function load(file, { mocks = {}, env = {}, globals = {} } = {}) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  // The compiled CommonJS output expects `module` and `exports` in scope;
  // the host-side name is `mod` because `module` is reserved in an ES module.
  const mod = { exports: {} };
  const context = {
    module: mod,
    exports: mod.exports,
    require: (name) => {
      if (name === "server-only") return {};
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error(`${file} required "${name}" and the test gave no fake for it`);
    },
    process: { env },
    Response,
    Request,
    Headers,
    URL,
    URLSearchParams,
    FormData,
    AbortSignal,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    Promise,
    Error,
    console,
    ...globals,
  };
  new vm.Script(compiled, { filename: file }).runInNewContext(context);
  return mod.exports;
}

/** A console whose error() calls are kept, for asserting what was logged. */
export function capturedConsole() {
  const errors = [];
  return { errors, console: { error: (...a) => errors.push(a.map(String).join(" ")), log() {}, warn() {} } };
}

/** The next/server surface the API routes touch. */
export const nextServer = {
  NextResponse: {
    json: (body, init) => Response.json(body, init),
    redirect: (url, status) => Response.redirect(url, status),
  },
};
