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
    .command("init <type> <folderName>")
    .description("Initialize a new project")
    .action(initCommand);

  program
    .command("compile-js <inPath> [outDir]")
    .description("Compile JS/TS files")
    .action(compileJSCommand);

  program
    .command("compile-c <inPath> [outDir]")
    .description("Compile C files")
    .action(compileCCommand);

  program
    .command("debug <accountLabel> <accountValue>")
    .description("Debug with a selected account")
    .action(debugCommand);

  program
    .command("newcreds <name>")
    .description("Create new credentials for an account")
    .action(newCredsCommand);

  await program.parseAsync(process.argv);
}
