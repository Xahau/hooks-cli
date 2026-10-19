#!/usr/bin/env node

const { main } = require("../dist/npm/src/cli");

async function run() {
  await main("c");
}

run();
