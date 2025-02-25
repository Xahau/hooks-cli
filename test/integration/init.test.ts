import { initCommand } from "../../src/commands";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

jest.mock("axios");

describe("Init Tests", () => {
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeAll(() => {
    // Mock console.error to suppress error messages during tests
    console.error = jest.fn();
    // Mock process.exit to prevent exiting during tests
    process.exit = jest.fn() as any;
  });

  afterAll(() => {
    // Restore original console.error and process.exit
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe("initCommand", () => {
    const folderNameC = "test-c-project";
    const folderNameJS = "test-js-project";
    const projectPathC = path.join(process.cwd(), folderNameC);
    const projectPathJS = path.join(process.cwd(), folderNameJS);

    beforeEach(() => {
      // Clean up any existing directories
      if (fs.existsSync(projectPathC)) {
        fs.rmdirSync(projectPathC, { recursive: true });
      }
      if (fs.existsSync(projectPathJS)) {
        fs.rmdirSync(projectPathJS, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up created directories
      if (fs.existsSync(projectPathC)) {
        fs.rmdirSync(projectPathC, { recursive: true });
      }
      if (fs.existsSync(projectPathJS)) {
        fs.rmdirSync(projectPathJS, { recursive: true });
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

      await initCommand("c", folderNameC);

      // Verify that the directory was created
      expect(fs.existsSync(projectPathC)).toBe(true);

      // Verify that .env file was created
      const envFilePath = path.join(projectPathC, ".env");
      expect(fs.existsSync(envFilePath)).toBe(true);

      // Verify contents of .env file
      const envContent = fs.readFileSync(envFilePath, "utf-8");
      expect(envContent).toContain("HOOKS_COMPILE_HOST");
      expect(envContent).toContain("XAHAU_ENV");
      expect(envContent).toContain("XRPLD_WSS");
      expect(envContent).toContain("ALICE_SEED=ss8Smfd73swruz4LATV5xkmydjZd6");
    });

    it("should initialize a new JS project", async () => {
      // Mock axios response
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          code: "tesSUCCESS",
          secret: "ss8Smfd73swruz4LATV5xkmydjZd6",
        },
      });

      await initCommand("js", folderNameJS);

      // Verify that the directory was created
      expect(fs.existsSync(projectPathJS)).toBe(true);

      // Verify that .env file was created
      const envFilePath = path.join(projectPathJS, ".env");
      expect(fs.existsSync(envFilePath)).toBe(true);

      // Verify contents of .env file
      const envContent = fs.readFileSync(envFilePath, "utf-8");
      expect(envContent).toContain("HOOKS_COMPILE_HOST");
      expect(envContent).toContain("XAHAU_ENV");
      expect(envContent).toContain("XRPLD_WSS");
      expect(envContent).toContain("ALICE_SEED=ss8Smfd73swruz4LATV5xkmydjZd6");
    });

    it("should handle existing directory error", async () => {
      // Create the directory beforehand to simulate existing directory
      fs.mkdirSync(projectPathC, { recursive: true });

      await initCommand("c", folderNameC);

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        `Directory ${folderNameC} already exists.`
      );
    });
  });
});
