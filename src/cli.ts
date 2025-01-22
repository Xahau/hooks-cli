#!/usr/bin/env node

import { Command } from "commander";
import {
  initCommand,
  compileJSCommand,
  compileCCommand,
  debugCommand,
  newCredsCommand,
} from "./commands";

export async function main() {
  const program = new Command();

  program
    .command("init")
    .description("Initialize a new project")
    .argument("type", "The type of project to initialize, 'c' or 'js'")
    .argument("folderName", "The name of the folder to initialize")
    .action(initCommand);

  program
    .command("compile-js")
    .description("Compile JS/TS files")
    .argument("inPath", "The path to the input file")
    .argument("outDir", "The path to the output directory")
    .action(compileJSCommand);

  program
    .command("compile-c")
    .description("Compile C files")
    .argument("inPath", "The path to the input file or directory")
    .argument("outDir", "The path to the output directory")
    .action(compileCCommand);

  program
    .command("debug")
    .description("Debug with a selected account")
    .argument("label", "The label of the account to debug")
    .argument("r-address", "The r-address of the account to debug")
    .action(debugCommand);

  program
    .command("newcreds")
    .description("Create new credentials for an account")
    .argument("name", "The name of the account to create credentials for")
    .action(newCredsCommand);

  await program.parseAsync(process.argv);
}
