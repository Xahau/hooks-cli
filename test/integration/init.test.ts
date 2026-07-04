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
      // Mock axios response
      jest.mock("axios");
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
