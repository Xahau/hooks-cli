import { initCommand } from "../../src/commands";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import axios from "axios";

jest.mock("axios");

// These tests exercise the actual `yarn install` / `yarn run build` flow of a
// freshly generated project (as an end user would run them), so they need
// real network access to the npm registry and a longer timeout than the
// other integration tests.
describe("Init project install/build", () => {
  const repoRoot = path.join(__dirname, "..", "..");
  const binDir = path.join(repoRoot, "bin");
  const cliEntry = path.join(repoRoot, "dist", "npm", "src", "cli.js");

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();

    // The generated project's `build` script shells out to the `hooks-cli`
    // binary, which requires this repo to already be built.
    if (!fs.existsSync(cliEntry)) {
      execFileSync("yarn", ["run", "build"], {
        cwd: repoRoot,
        stdio: "inherit",
      });
    }
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  const headerFiles = {
    error: "#define INTERNAL_ERROR -2\n",
    extern: "extern int64_t accept(uint32_t, uint32_t, int64_t);\n",
    hookapi: '#include "macro.h"\n',
    macro: "#define SBUF(str) (uint32_t)(str), sizeof(str)\n",
    sfcodes: "#define sfAccount ((8U << 16U) + 1U)\n",
    tts: "#define ttINVOKE 99\n",
  };

  const runInProject = (projectDir: string, args: string[]) =>
    execFileSync("yarn", args, {
      cwd: projectDir,
      env: { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
      stdio: "pipe",
    });

  describe.each([
    ["c", "e2e-init-build-c-project"],
    ["js", "e2e-init-build-js-project"],
  ])("%s project", (type, folderName) => {
    // Generated deliberately outside the repo tree (rather than e.g. a
    // subdirectory of repoRoot): initCommand's copyFiles gives the project
    // its own node_modules, but Node's require() resolution still walks up
    // through ancestor node_modules directories. If the project lived under
    // repoRoot, a package missing from the project's own install could
    // silently resolve from this repo's node_modules instead of failing
    // (verified: repoRoot has several deps, e.g. dotenv, in common with the
    // templates), masking a bug a real, non-nested user project would hit.
    let tmpBase: string;
    let projectPath: string;

    beforeEach(() => {
      jest.clearAllMocks();
      tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "hooks-cli-init-"));
      projectPath = path.join(tmpBase, folderName);
    });

    afterEach(() => {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    });

    it(
      "installs and builds successfully",
      async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: headerFiles });
        (axios.post as jest.Mock).mockResolvedValue({
          data: { code: "tesSUCCESS", secret: "ss8Smfd73swruz4LATV5xkmydjZd6" },
        });

        // initCommand resolves the target directory from process.cwd(), so
        // point it at tmpBase just for this call.
        const originalCwd = process.cwd();
        process.chdir(tmpBase);
        try {
          await initCommand(type as "c" | "js", folderName);
        } finally {
          process.chdir(originalCwd);
        }
        expect(fs.existsSync(projectPath)).toBe(true);

        if (type === "c") {
          // The mocked header files above are stand-ins used only to
          // exercise initCommand's download/write logic; they are not real
          // enough to compile against. Clearing them makes the CLI fall
          // back to its bundled default headers, which is what a project
          // generated without a live compile host would also do.
          const includeDir = path.join(projectPath, "contracts", "include");
          fs.readdirSync(includeDir).forEach((file) =>
            fs.rmSync(path.join(includeDir, file))
          );
        }

        try {
          runInProject(projectPath, ["install"]);
          runInProject(projectPath, ["run", "build"]);
        } catch (error: unknown) {
          const err = error as { stdout?: Buffer; stderr?: Buffer };
          throw new Error(
            `yarn install/build failed for ${type} project:\n${err.stdout?.toString()}\n${err.stderr?.toString()}`
          );
        }

        const buildDir = path.join(projectPath, "build");
        expect(fs.existsSync(buildDir)).toBe(true);
        expect(fs.readdirSync(buildDir).length).toBeGreaterThan(0);
      },
      5 * 60 * 1000
    );
  });
});
