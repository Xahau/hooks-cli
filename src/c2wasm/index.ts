import fs from "node:fs";
import path from "node:path";

const DEFAULT_HEADERS = path.join(
  __dirname,
  "..",
  "init",
  "c",
  "contracts",
  "include"
);

// Keyed by basename, as the compile server was: `#include "foo.h"` finds headers/sub/foo.h.
const getHeaders = (
  headersPath: string | undefined
): Record<string, string> => {
  let files: FileObject[] = [];
  if (headersPath) {
    try {
      files = readFiles(headersPath).filter((file) => file.type === "h");
    } catch (error: unknown) {
      console.error(`Error reading header files: ${error}`);
      process.exit(1);
    }
    if (files.length === 0) {
      console.log("No header files detected, using default headers...");
    }
  } else {
    console.log("No header path specified, using default headers...");
  }
  if (files.length === 0) {
    files = readFiles(DEFAULT_HEADERS).filter((file) => file.type === "h");
  }
  return Object.fromEntries(files.map((file) => [file.name, file.src]));
};

export async function buildCDir(
  dirPath: string,
  outDir: string,
  headersPath: string | undefined
): Promise<void> {
  let fileObjects: FileObject[];
  try {
    fileObjects = readFiles(dirPath).filter((file) => file.type === "c");
  } catch (error: unknown) {
    console.error(`Error reading files: ${error}`);
    process.exit(1);
  }
  const headers = getHeaders(headersPath);
  // hooks-compiler shares one toolchain per process: build sequentially.
  for (const fileObject of fileObjects) {
    await buildWasm(fileObject, headers, outDir);
  }
}

export async function buildFile(
  filePath: string,
  outDir: string,
  headersPath: string | undefined
): Promise<void> {
  if (path.extname(filePath) !== ".c") {
    throw Error("Invalid file type. must be .c file");
  }
  const fileObject: FileObject = {
    type: "c",
    name: path.basename(filePath),
    src: fs.readFileSync(filePath, "utf-8"),
  };
  await buildWasm(fileObject, getHeaders(headersPath), outDir);
}

// Function to read all files in a directory tree
export function readFiles(dirPath: string): FileObject[] {
  const files: FileObject[] = [];
  const fileNames = fs.readdirSync(dirPath);
  for (const fileName of fileNames) {
    const filePath = path.join(dirPath, fileName);
    const fileStat = fs.statSync(filePath);
    if (fileStat.isDirectory()) {
      const ignore = ["node_modules", ".git", ".vscode", ".idea", ".DS_Store"];
      if (!ignore.includes(fileName)) {
        files.push(...readFiles(filePath));
      }
    } else if (path.extname(fileName) === ".c") {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      files.push({
        type: "c",
        name: fileName,
        src: fileContent,
      });
    } else if (path.extname(fileName) === ".h") {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      files.push({
        type: "h",
        name: fileName,
        src: fileContent,
      });
    }
  }
  return files;
}

async function buildWasm(
  fileObject: FileObject,
  headers: Record<string, string>,
  outDir: string
) {
  const name = path.basename(fileObject.name, ".c");
  // Must stay a real dynamic import: hooks-compiler is ESM-only.
  const { compile } = await import("hooks-compiler");
  fs.mkdirSync(outDir, { recursive: true });
  try {
    const r = await compile({
      files: { ...headers, [fileObject.name]: fileObject.src },
      entry: fileObject.name,
    });
    const out = path.join(outDir, `${name}.wasm`);
    fs.writeFileSync(out, r.wasm);
    console.log(`Output: ${out} ${r.finalSize}b sha256 ${r.sha256}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    fs.writeFileSync(path.join(outDir, `${name}.log`), message);
    console.error(message);
    process.exit(1);
  }
}
