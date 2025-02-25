import { buildFile as buildJSFile } from "./js2qjsc";
import { buildFile as buildCFile, buildCDir } from "./c2wasm";
import { mkdir, statSync, writeFileSync } from "fs";
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { addListeners, ISelect } from "./debug";
import axios from "axios";

const copyFiles = (source: string, destination: string) => {
  fs.readdirSync(source).forEach((file) => {
    const srcFile = path.join(source, file);
    const destFile = path.join(destination, file);

    if (fs.statSync(srcFile).isDirectory()) {
      fs.mkdirSync(destFile, { recursive: true });
      copyFiles(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
};

const clean = (filePath: string, outputPath?: string): string => {
  const tsCode = fs.readFileSync(filePath, "utf-8");
  const importPattern = /^\s*import\s+.*?;\s*$/gm;
  const exportPattern = /^\s*export\s*\{[^}]*\};?\s*$/gm;
  const commentPattern = /^\s*\/\/.*$/gm;
  let cleanedCode = tsCode.replace(importPattern, "");
  cleanedCode = cleanedCode.replace(exportPattern, "");
  cleanedCode = cleanedCode.replace(commentPattern, "");
  cleanedCode = cleanedCode.trim();
  if (outputPath) {
    fs.writeFileSync(outputPath, cleanedCode, "utf-8");
  }
  return cleanedCode;
};

export const initCommand = async (type: "c" | "js", folderName: string) => {
  const templateDir = path.join(__dirname, "init", type);
  const newProjectDir = path.join(process.cwd(), folderName);

  if (fs.existsSync(newProjectDir)) {
    console.error(`Directory ${folderName} already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(newProjectDir, { recursive: true });

  if (type === "c" || type === "js") {
    // TODO: Remove this when jshooks is merged into mainnet
    if (type === "js") {
      process.env.NETWORK_NAME = "jshooks";
      process.env.NETWORK_DOMAIN = "jshooks.xahau-test.net";
    }
    copyFiles(templateDir, newProjectDir);
    console.log(
      `Created ${
        type === "c" ? "CHooks" : "JSHooks"
      } project in ${newProjectDir}`
    );
    try {
      const aliceResponse = await axios.post(
        `https://${process.env.NETWORK_DOMAIN}/newcreds`
      );
      if (aliceResponse.data.error) {
        console.error(aliceResponse.data.error);
        process.exit(1);
      }
      if (aliceResponse.data.code === "tesSUCCESS") {
        const aliceSecret = aliceResponse.data.secret;

        const envFilePath = path.join(newProjectDir, ".env");
        const envObject = {
          HOOKS_COMPILE_HOST: process.env.HOOKS_COMPILE_HOST || "",
          XRPLD_ENV: process.env.NETWORK_NAME || "",
          XRPLD_WSS: `wss://${process.env.NETWORK_DOMAIN}`,
          ALICE_SEED: aliceSecret,
        };
        const envContent = Object.entries(envObject)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");
        writeFileSync(envFilePath, envContent, { encoding: "utf-8" });

        console.log("Secrets saved to .env file.");
      } else {
        console.error("Failed to retrieve secrets from the server.");
      }
    } catch (error) {
      console.error("Error making POST requests:", error);
    }
  } else {
    console.error('Invalid type. Use "c" for CHooks or "js" for JSHooks.');
    process.exit(1);
  }
};

export const compileJSCommand = async (inPath: string, outDir: string) => {
  if (!inPath || inPath === "") {
    console.error("Input path is required.");
    process.exit(1);
  }

  if (!outDir || outDir === "") {
    console.error("Output directory path is required.");
    process.exit(1);
  }

  try {
    const outStat = statSync(outDir);
    if (!outStat.isDirectory()) {
      console.error("Output path must be a directory.");
      process.exit(1);
    }
  } catch (error: any) {
    mkdir(outDir, { recursive: true }, (err) => {
      if (err) {
        console.error(`Failed to create directory: ${outDir}`);
        process.exit(1);
      }
      console.log(`Created directory: ${outDir}`);
    });
  }

  if (path.extname(inPath) === ".ts") {
    const file = inPath.split("/").pop();
    const filename = file?.split(".ts")[0];
    const newPath = inPath.replace(file as string, `dist/${filename}.js`);
    await esbuild.build({
      entryPoints: [inPath],
      outfile: newPath,
      bundle: true,
      format: "esm",
    });
    clean(newPath, newPath);
    await buildJSFile(newPath, outDir);
    return;
  }

  const dirStat = statSync(inPath);
  if (dirStat.isDirectory()) {
    throw Error("JS2Wasm Can ONLY build files");
  } else {
    await buildJSFile(inPath, outDir);
  }
};

export const compileCCommand = async (
  inPath: string,
  outDir: string,
  args?: Record<string, any>
) => {
  if (!inPath || inPath === "") {
    console.error("Input path is required.");
    process.exit(1);
  }

  if (typeof inPath !== "string") {
    console.error("Input path must be a string.");
    process.exit(1);
  }

  if (!outDir || outDir === "") {
    console.error("Output directory path is required.");
    process.exit(1);
  }

  if (typeof outDir !== "string") {
    console.error("Output path must be a string.");
    process.exit(1);
  }

  try {
    const outStat = statSync(outDir);
    if (!outStat.isDirectory()) {
      console.error("Output path must be a directory.");
      process.exit(1);
    }
  } catch (error: any) {
    mkdir(outDir, { recursive: true }, (err) => {
      if (err) {
        console.error(`Failed to create directory: ${outDir}`);
        process.exit(1);
      }
      console.log(`Created directory: ${outDir}`);
    });
  }

  const headersPath = args?.headers;
  if (headersPath) {
    if (typeof headersPath !== "string") {
      console.error("headers path must be a string.");
      process.exit(1);
    }
    const dirStat = fs.statSync(headersPath);
    if (!dirStat.isDirectory()) {
      console.error("headers path must be a directory.");
      process.exit(1);
    }
  }

  const dirStat = fs.statSync(inPath);
  if (dirStat.isDirectory()) {
    await buildCDir(inPath, outDir, headersPath);
  } else {
    await buildCFile(inPath, outDir, headersPath);
  }
};

export const debugCommand = async (
  accountLabel: string,
  accountValue: string
) => {
  const selectedAccount: ISelect | null = {
    label: accountLabel,
    value: accountValue,
  };

  addListeners(selectedAccount);
};
