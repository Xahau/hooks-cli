#!/usr/bin/env node

import { Command } from "commander";
import {
  initCommand,
  compileJSCommand,
  compileCCommand,
  debugCommand,
} from "./commands";

type Target = "c" | "js";

export async function main(target?: Target) {
  const program = new Command();

  if (target === "c") {
    program
      .description("Compile C files")
      .argument("inPath", "The path to the input file or directory")
      .argument("outDir", "The path to the output directory")
      .option("--headers [path]", "header path (dir)")
      .showHelpAfterError()
      .action(compileCCommand);
  } else if (target === "js") {
    program
      .description("Compile JS/TS files")
      .argument("inPath", "The path to the input file")
      .argument("outDir", "The path to the output directory")
      .showHelpAfterError()
      .action(compileJSCommand);
  } else {
    program
      .command("init")
      .description("Initialize a new project")
      .argument("type", "The type of project to initialize, 'c' or 'js'")
      .argument("folderName", "The name of the folder to initialize")
      .showHelpAfterError()
      .action(initCommand);

    program
      .command("compile-js")
      .description("Compile JS/TS files")
      .argument("inPath", "The path to the input file")
      .argument("outDir", "The path to the output directory")
      .showHelpAfterError()
      .action(compileJSCommand);

    program
      .command("compile-c")
      .description("Compile C files")
      .argument("inPath", "The path to the input file or directory")
      .argument("outDir", "The path to the output directory")
      .option("--headers [path]", "header path (dir)")
      .showHelpAfterError()
      .action(compileCCommand);

    program
      .command("debug")
      .description("Debug with a selected account")
      .argument("label", "The label of the account to debug")
      .argument("r-address", "The r-address of the account to debug")
      .showHelpAfterError()
      .action(debugCommand);
  }
  await program.parseAsync(process.argv);
}
