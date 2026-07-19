import { initCommand } from "../../src/commands";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { configDotenv } from "dotenv";

jest.mock("axios");

describe("Init Tests", () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeAll(() => {
    // Mock console.log to suppress log messages during tests
    console.log = jest.fn();
    // Mock console.error to suppress error messages during tests
    console.error = jest.fn();
    // replace process.exit with a function that throws an error
    process.exit = jest.fn(() => {
      throw Error("Process exit called");
    });
  });

  afterAll(() => {
    // Restore original console.log, console.error and process.exit
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe("initCommand", () => {
    const folderNameC = "test-c-project";
    const folderNameJS = "test-js-project";
    const projectPathC = path.join(process.cwd(), folderNameC);
    const projectPathJS = path.join(process.cwd(), folderNameJS);
    const tempPathC = path.join(__dirname, "..", "..", "src", "init", "c");
    const tempPathJS = path.join(__dirname, "..", "..", "src", "init", "js");

    beforeEach(() => {
      jest.clearAllMocks();

      // Clean up any existing directories
      if (fs.existsSync(projectPathC)) {
        fs.rmSync(projectPathC, { recursive: true, force: true });
      }
      if (fs.existsSync(projectPathJS)) {
        fs.rmSync(projectPathJS, { recursive: true, force: true });
      }
    });

    afterEach(() => {
      // Clean up created directories
      if (fs.existsSync(projectPathC)) {
        fs.rmSync(projectPathC, { recursive: true, force: true });
      }
      if (fs.existsSync(projectPathJS)) {
        fs.rmSync(projectPathJS, { recursive: true, force: true });
      }
    });

    it("should initialize a new C project", async () => {
      const headerFiles = {
        error: "#define INTERNAL_ERROR -2\n",
        extern: "extern int64_t accept(uint32_t, uint32_t, int64_t);\n",
        hookapi: '#include "macro.h"\n',
        macro: "#define SBUF(str) (uint32_t)(str), sizeof(str)\n",
        sfcodes: "#define sfAccount ((8U << 16U) + 1U)\n",
        tts: "#define ttINVOKE 99\n",
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: headerFiles });
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          code: "tesSUCCESS",
          secret: "ss8Smfd73swruz4LATV5xkmydjZd6",
        },
      });

      await expect(initCommand("c", folderNameC)).resolves.not.toThrow();

      // Verify that the directory was created
      expect(fs.existsSync(projectPathC)).toBe(true);

      // Verify that .env file was created
      const envFilePath = path.join(projectPathC, ".env");
      expect(fs.existsSync(envFilePath)).toBe(true);

      // Verify contents of .env file
      const envContent = fs.readFileSync(envFilePath, "utf-8");
      expect(envContent).toContain("HOOKS_COMPILE_HOST");
      expect(envContent).toContain("HOOKS_DEBUG_HOST");
      expect(envContent).toContain("XAHAU_ENV");
      expect(envContent).toContain("XRPLD_WSS");
      expect(envContent).toContain("ALICE_SEED=ss8Smfd73swruz4LATV5xkmydjZd6");

      const env = configDotenv({ path: envFilePath }).parsed;
      const originalEnv = configDotenv({
        path: path.join(tempPathC, ".env"),
      }).parsed;
      expect(env?.HOOKS_COMPILE_HOST).toBeDefined();
      expect(env?.HOOKS_COMPILE_HOST).toEqual(originalEnv?.HOOKS_COMPILE_HOST);
      expect(env?.HOOKS_DEBUG_HOST).toBeDefined();
      expect(env?.HOOKS_DEBUG_HOST).toEqual(originalEnv?.HOOKS_DEBUG_HOST);
      expect(env?.XAHAU_ENV).toBeDefined();
      expect(env?.XAHAU_ENV).toEqual(originalEnv?.XAHAU_ENV);
      expect(env?.XRPLD_WSS).toBeDefined();
      expect(env?.XRPLD_WSS).toEqual(originalEnv?.XRPLD_WSS);
      expect(env?.ALICE_SEED).toBeDefined();

      expect(axios.get).toHaveBeenCalledWith(
        `${originalEnv?.HOOKS_COMPILE_HOST}/api/header-files`
      );

      const includePath = path.join(projectPathC, "contracts", "include");
      expect(fs.statSync(includePath).isDirectory()).toBe(true);
      expect(fs.readdirSync(includePath).sort()).toEqual(
        Object.keys(headerFiles)
          .map((name) => `${name}.h`)
          .sort()
      );
      Object.entries(headerFiles).forEach(([name, content]) => {
        expect(
          fs.readFileSync(path.join(includePath, `${name}.h`), "utf-8")
        ).toBe(content);
      });

      const generatedPackage = JSON.parse(
        fs.readFileSync(path.join(projectPathC, "package.json"), "utf-8")
      );
      expect(generatedPackage.scripts.build).toBe(
        "hooks-cli compile-c contracts build/ --headers contracts/include"
      );
    });

    it("should initialize a new JS project", async () => {
      // Mock axios response
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          code: "tesSUCCESS",
          secret: "ss8Smfd73swruz4LATV5xkmydjZd6",
        },
      });

      await expect(initCommand("js", folderNameJS)).resolves.not.toThrow();

      expect(axios.get).not.toHaveBeenCalled();

      // Verify that the directory was created
      expect(fs.existsSync(projectPathJS)).toBe(true);

      // Verify that .env file was created
      const envFilePath = path.join(projectPathJS, ".env");
      expect(fs.existsSync(envFilePath)).toBe(true);

      // Verify contents of .env file
      const envContent = fs.readFileSync(envFilePath, "utf-8");
      expect(envContent).toContain("HOOKS_COMPILE_HOST");
      expect(envContent).toContain("HOOKS_DEBUG_HOST");
      expect(envContent).toContain("XAHAU_ENV");
      expect(envContent).toContain("XRPLD_WSS");
      expect(envContent).toContain("ALICE_SEED=ss8Smfd73swruz4LATV5xkmydjZd6");

      const env = configDotenv({ path: envFilePath }).parsed;
      const originalEnv = configDotenv({
        path: path.join(tempPathJS, ".env"),
      }).parsed;
      expect(env?.HOOKS_COMPILE_HOST).toBeDefined();
      expect(env?.HOOKS_COMPILE_HOST).toEqual(originalEnv?.HOOKS_COMPILE_HOST);
      expect(env?.HOOKS_DEBUG_HOST).toBeDefined();
      expect(env?.HOOKS_DEBUG_HOST).toEqual(originalEnv?.HOOKS_DEBUG_HOST);
      expect(env?.XAHAU_ENV).toBeDefined();
      expect(env?.XAHAU_ENV).toEqual(originalEnv?.XAHAU_ENV);
      expect(env?.XRPLD_WSS).toBeDefined();
      expect(env?.XRPLD_WSS).toEqual(originalEnv?.XRPLD_WSS);
      expect(env?.ALICE_SEED).toBeDefined();
    });

    it("should fail C initialization when a required header is missing", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          error: "error",
          extern: "extern",
          hookapi: "hookapi",
          macro: "macro",
          sfcodes: "sfcodes",
        },
      });

      await expect(initCommand("c", folderNameC)).rejects.toThrow(
        "Missing or invalid header file: tts.h"
      );

      expect(axios.post).not.toHaveBeenCalled();
      expect(
        fs.existsSync(path.join(projectPathC, "contracts", "include"))
      ).toBe(false);
    });

    it("should handle existing directory error", async () => {
      // Create the directory beforehand to simulate existing directory
      fs.mkdirSync(projectPathC, { recursive: true });

      await expect(initCommand("c", folderNameC)).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        `Directory ${folderNameC} already exists.`
      );
    });
  });
});
