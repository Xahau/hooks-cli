#!/usr/bin/env node

import "dotenv/config";
import { Command } from "commander";
import { compileCCommand, debugCommand, initCommand } from "./commands";

type Target = "c";

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
  } else {
    program
      .command("init")
      .description("Initialize a new project")
      .argument("type", "The type of project to initialize, 'c'")
      .argument("folderName", "The name of the folder to initialize")
      .option(
        "-p, --package-manager <manager>",
        "The package manager to use in the generated project ('npm', 'yarn', or 'pnpm')",
        "npm"
      )
      .showHelpAfterError()
      .action(initCommand);

    program
      .command("compile-c")
      .description("Compile C files")
      .argument("inPath", "The path to the input file or directory")
      .argument("outDir", "The path to the output directory")
      .option("--headers [path]", "header path (dir)", "")
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
