// Importing required modules
import axios from "axios";
import fs from "fs";
import path from "path";
import { decodeBinary } from "../2wasm/decodeBinary";
import "dotenv/config";

interface Task {
  name: string;
  console: string;
  success: boolean;
}

interface BuildResult {
  success: boolean;
  message: string;
  output: string;
  tasks: Task[];
}

export async function buildCDir(
  dirPath: string,
  outDir: string,
  headersPath: string | undefined
): Promise<void> {
  // Reading all files in the directory tree
  let fileObjects: any[];
  try {
    fileObjects = readFiles(dirPath);
  } catch (error: any) {
    console.error(`Error reading files: ${error}`);
    process.exit(1);
  }

  let headerObjects: any[] = [];
  if (headersPath) {
    try {
      headerObjects = readFiles(headersPath).filter(
        (file) => file.type === "h"
      );
    } catch (error: any) {
      console.error(`Error reading header files: ${error}`);
      process.exit(1);
    }
    if (headerObjects.length === 0) {
      console.log("No header files detected, using default headers...");
    }
  } else {
    console.log("No header path specified, using default headers...");
  }

  // Building wasm for each file object
  await Promise.all(
    fileObjects.map(async (fileObject) => {
      try {
        await buildWasm(fileObject, headerObjects, outDir);
      } catch (error) {
        console.error(`Error building wasm: ${error}`);
        process.exit(1);
      }
    })
  ).catch((error) => {
    console.error(`Error building wasm: ${error}`);
    process.exit(1);
  });
}

export async function buildFile(
  filePath: string,
  outDir: string,
  headerPath: string | undefined
): Promise<void> {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  if (!filePath.includes(".c")) {
    throw Error("Invalid file type. must be .c file");
  }
  const filename = filePath.split("/").pop();
  const fileObject = {
    type: "c",
    name: filename,
    src: fileContent,
  };
  let headerObjects: any[] = [];
  if (headerPath) {
    try {
      headerObjects = readFiles(headerPath).filter((file) => file.type === "h");
    } catch (error: any) {
      console.error(`Error reading header files: ${error}`);
      process.exit(1);
    }
    if (headerObjects.length === 0) {
      console.log("No header files detected, using default headers...");
    }
  } else {
    console.log("No header path specified, using default headers...");
  }
  try {
    await buildWasm(fileObject, headerObjects, outDir);
  } catch (error) {
    console.error(`Error building wasm: ${error}`);
    process.exit(1);
  }
}

// Function to read all files in a directory tree
export function readFiles(dirPath: string): any[] {
  const files: any[] = [];
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
        options: "-O3",
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

function parseBuildResult(result: BuildResult): string {
  const errorConsole: string[] = [];

  result.tasks.forEach((task) => {
    if (!task.success) {
      errorConsole.push(task.console);
    }
  });

  if (errorConsole.length > 0) {
    return errorConsole.join("\n");
  }

  return "";
}

async function saveFileOrError(
  outDir: string,
  filename: string,
  result: BuildResult
): Promise<void> {
  if (!result.success) {
    fs.writeFileSync(
      path.join(outDir + "/" + filename + ".log"),
      parseBuildResult(result)
    );
    console.error(parseBuildResult(result));
    throw Error(result.message);
  } else {
    const binary = await decodeBinary(result.output);
    fs.writeFileSync(
      path.join(outDir + "/" + filename + ".wasm"),
      Buffer.from(binary)
    );
  }
}

export async function buildWasm(
  fileObject: any,
  headerObjects: any[],
  outDir: string
) {
  const filename = fileObject.name.split(".c")[0];
  // Sending API call to endpoint
  const body = JSON.stringify({
    output: "wasm",
    compress: true,
    strip: true,
    files: [fileObject],
    headers: headerObjects,
  });
  const baseUrl = process.env.HOOKS_COMPILE_HOST;
  if (!baseUrl) {
    throw Error("Environment variable HOOKS_COMPILE_HOST is not set");
  }
  try {
    const response = await axios.post(`${baseUrl}/api/build`, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    // Saving response to file
    const responseData = response.data;
    const success = responseData.success === true;
    const message = responseData.message;
    const output = success ? responseData.output : "";
    const tasks = responseData.tasks.map((task: Task) => {
      return {
        name: task.name,
        console: task.console,
        success: task.success === true,
      } as Task;
    });

    // Creating result object
    const result = {
      success,
      message,
      output,
      tasks,
    } as BuildResult;
    fs.mkdirSync(outDir, { recursive: true });
    await saveFileOrError(outDir, filename, result);
  } catch (error: any) {
    throw Error(`Error sending API call: ${error}`);
  }
}
