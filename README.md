# Hooks CLI [![npm version](https://badge.fury.io/js/%40xahau%2Fhooks-cli.svg)](https://www.npmjs.com/package/@xahau/hooks-cli)

## Global Usage (For Using as a CLI)

Install:

```bash
npm i -g @xahau/hooks-cli
```

Use:

You can initialize a new project by running:

```bash
hooks-cli init <c> <folderName>
```

By default, the generated project's scripts use `npm`. To use `yarn` or `pnpm` instead, pass `--package-manager`:

```bash
hooks-cli init c my-project --package-manager pnpm
```

To build the c contracts, run:

```bash
hooks-cli compile-c contracts build --headers headers
```

or (alias)

```bash
c2wasm-cli contracts build --headers headers
```

This will compile the `contracts` directory and output the `.wasm` files into the `build` directory.

Compilation runs locally via [hooks-compiler](https://www.npmjs.com/package/hooks-compiler) (no compile server is used) and requires Node >= 20.12. If `--headers` is omitted, or the directory has no files, the bundled default headers are used. The bundled headers (also copied into `contracts/include` by `init c`) are `hook/*.h` from the [xahaud](https://github.com/Xahau/xahaud) `release` branch; `pnpm headers:update` refreshes them and CI runs `pnpm headers:check` to flag drift.

To listen to the debug stream, run:

```bash
hooks-cli debug "Account 1" rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn
```

## SDK Usage (For Using as an SDK)

Install:

```bash
npm install @xahau/hooks-cli
```

Usage:

```javascript
import { compileC } from "@xahau/hooks-cli";

const dirPath = "my/path/to/hooks/root/dir";
const outDir = "my/build/wasm/directory";
await compileC(dirPath, outDir, { headers: "my/headers/dir" });
```

## Development / Deployment

### Build Repo

```bash
pnpm run build
```

### Build Executable Package

```bash
pkg .
```

### Publish NPM Package

```bash
npm publish --access=public
```
