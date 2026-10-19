import * as fs from "node:fs";
import { statSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import axios from "axios";
import dotenv from "dotenv";
import { buildCDir, buildFile as buildCFile } from "./c2wasm";
import { addListeners, type ISelect } from "./debug";

export type PackageManager = "npm" | "yarn" | "pnpm";
const PACKAGE_MANAGERS: PackageManager[] = ["npm", "yarn", "pnpm"];

const applyPackageManager = (
  projectDir: string,
  packageManager: PackageManager
) => {
  const packageJsonPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  if (pkg.scripts) {
    for (const name of Object.keys(pkg.scripts)) {
      pkg.scripts[name] = pkg.scripts[name].replace(/\bnpm\b/g, packageManager);
    }
  }
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(pkg, null, 2)}\n`,
    "utf-8"
  );
};

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

export const initCommand = async (
  type: "c",
  folderName: string,
  options?: { packageManager?: string }
) => {
  const packageManager = (options?.packageManager ?? "npm") as PackageManager;
  if (!PACKAGE_MANAGERS.includes(packageManager)) {
    console.error(
      `Invalid package manager "${packageManager}". Use one of: ${PACKAGE_MANAGERS.join(
        ", "
      )}.`
    );
    process.exit(1);
  }

  if (type !== "c") {
    console.error('Invalid type. Use "c" for CHooks.');
    process.exit(1);
  }

  const templateDir = path.join(__dirname, "init", type);
  const newProjectDir = path.join(process.cwd(), folderName);

  if (fs.existsSync(newProjectDir)) {
    console.error(`Directory ${folderName} already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(newProjectDir, { recursive: true });

  copyFiles(templateDir, newProjectDir);
  applyPackageManager(newProjectDir, packageManager);
  console.log(`Created CHooks project in ${newProjectDir}`);
  const projectEnv = dotenv.config({
    path: path.join(newProjectDir, ".env"),
  });
  if (!projectEnv.parsed) {
    console.log("No .env file found in the project template.");
    process.exit(1);
  }
  const env = projectEnv.parsed;
  try {
    const aliceResponse = await axios.post(
      `https://${env.XRPLD_WSS.replace("wss://", "")}/newcreds`
    );
    if (aliceResponse.data.error) {
      console.error(aliceResponse.data.error);
      process.exit(1);
    }
    if (aliceResponse.data.code === "tesSUCCESS") {
      const aliceSecret = aliceResponse.data.secret;

      const envFilePath = path.join(newProjectDir, ".env");
      const envObject = {
        ...env,
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
  } catch {
    fs.mkdirSync(outDir, { recursive: true });
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
