import {
  compileJSCommand,
  compileCCommand,
  // debugCommand,
  // newCredsCommand,
} from "../../src/commands";
import * as fs from "fs";
import * as path from "path";

describe("Build Tests", () => {
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

  describe("compileJSCommand", () => {
    const inPathTS = path.join(process.cwd(), "contracts-js", "base.js");
    const outDir = path.join(process.cwd(), "build");

    beforeEach(() => {
      // Ensure output directory does not exist
      if (fs.existsSync(outDir)) {
        fs.rmdirSync(outDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up
      if (fs.existsSync(outDir)) {
        fs.rmdirSync(outDir, { recursive: true });
      }
    });

    it("should compile a JS file to Wasm", async () => {
      await compileJSCommand(inPathTS, outDir);
      expect(fs.existsSync(path.join(outDir, "base.bc"))).toBe(true);
    });

    it("should handle missing input path error", async () => {
      try {
        await compileJSCommand("", outDir);
      } catch (error) {
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith("Input path is required.");
      }
    });

    it("should handle missing output directory error", async () => {
      await compileJSCommand(inPathTS, "");

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        "Output directory path is required."
      );
    });
  });

  describe("compileCCommand", () => {
    const inPathC = path.join(process.cwd(), "contracts-c", "base.c");
    const outDir = path.join(process.cwd(), "build");

    beforeEach(() => {
      // Ensure output directory does not exist
      if (fs.existsSync(outDir)) {
        fs.rmdirSync(outDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up
      if (fs.existsSync(outDir)) {
        fs.rmdirSync(outDir, { recursive: true });
      }
    });

    it("should compile a C file to Wasm", async () => {
      await compileCCommand(inPathC, outDir);
      expect(fs.existsSync(path.join(outDir, "base.wasm"))).toBe(true);
    });

    it("should handle missing input path error", async () => {
      try {
        await compileCCommand("", outDir);
      } catch (error) {
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith("Input path is required.");
      }
    });

    it("should handle missing output directory error", async () => {
      await compileCCommand(inPathC, "");

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        "Output directory path is required."
      );
    });
  });
});
