# Hooks CLI

## Global Usage (For Using as a CLI)

Install:

```bash
npm i -g @xahau/hooks-cli
```

Use:

You can initialize a new project by running:

```bash
hooks-cli init
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

To build the js contracts, run:

```bash
hooks-cli compile-js contracts/base.ts build
```

or (alias)

```bash
js2qjsc-cli contracts/base.ts build
```

This will compile the `base.ts` file and output the `.bc` file into the `build` directory.

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
import { buildDir } from "@xahau/hooks-cli";

const dirPath = "my/path/to/hooks/root/dir";
const outDir = "my/build/wasm/directory";
await buildDir(dirPath, outDir);
```

## Development / Deployment

### Build Repo

```bash
yarn run build
```

### Build Executable Package

```bash
pkg .
```

### Publish NPM Package

```bash
npm publish --access=public
```
