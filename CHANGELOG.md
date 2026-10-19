## [Unreleased]

### Breaking:
- JS Hooks support (`compile-js`, `js2qjsc-cli`, `init js`) removed.
- C Hooks are now compiled locally with `hooks-compiler@0.2.0`. `HOOKS_COMPILE_HOST` and the `--xrpl` flag are removed.
- Node >= 20.12 is required.

### Changed:
- `init c` ships the header files in `contracts/include`.

## [2.0.0] - 2025-01-22

### Updated:
- Renamed `hooks-toolkit-cli` to `hooks-cli`

## [2.0.1] - 2025-02-13

### Added:
- `headers` build the c contracts using local header files.

## [2.0.2] - 2025-02-16

### Fix:
- `headers` build the c contracts using local header files.

## [2.0.3] - 2025-02-21

### Fix:
- `headers` header args error.

## [2.0.4] - 2025-02-25

### Rename:
- `js2wasm` -> `js2qjsc`

## [2.0.6] - 2025-05-08

### Added:
- `--functions` flag to allow for building hooks and functional hooks

