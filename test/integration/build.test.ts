import {
  compileJSCommand,
  compileCCommand,
  // debugCommand,
  // newCredsCommand,
} from "../../src/commands";
import * as fs from "fs";
import * as path from "path";

describe("Build Tests", () => {
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
      await expect(compileJSCommand(inPathTS, outDir)).resolves.not.toThrow();
      expect(fs.existsSync(path.join(outDir, "base.bc"))).toBe(true);
    });

    it("should handle missing input path error", async () => {
      await expect(compileJSCommand("", outDir)).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith("Input path is required.");
    });

    it("should handle missing output directory error", async () => {
      await expect(compileJSCommand(inPathTS, "")).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        "Output directory path is required."
      );
    });

    it("should handle invalid export ts code error", async () => {
      const tmpFilename = path.join(__dirname, "invalid.ts");
      fs.writeFileSync(tmpFilename, `const Hook = ()=> { return accept('') }`);
      await expect(compileJSCommand(tmpFilename, outDir)).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith("No Hook export found");
      fs.unlinkSync(tmpFilename);
    });

    it("should handle invalid import js code error", async () => {
      const tmpFilename = path.join(__dirname, "invalid.js");
      fs.writeFileSync(
        tmpFilename,
        `
          import { invalid } from 'invalid';
          const Hook = ()=> {
            return accept('')
          }
          `
      );
      await expect(compileJSCommand(tmpFilename, outDir)).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        "import is not allowed in js code"
      );
      fs.unlinkSync(tmpFilename);
    });

    it.each([
      `export const Hook = ()=> { return accept('') }`,
      `
      const Hook = ()=> {
        return accept('')
      }
      export { Hook }
      `,
    ])("should handle invalid export js code error", async (code) => {
      const tmpFilename = path.join(__dirname, "invalid.js");
      fs.writeFileSync(tmpFilename, code);
      await expect(compileJSCommand(tmpFilename, outDir)).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        "export is not allowed in js code"
      );
      fs.unlinkSync(tmpFilename);
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
      await expect(compileCCommand(inPathC, outDir)).resolves.not.toThrow();
      expect(fs.existsSync(path.join(outDir, "base.wasm"))).toBe(true);
    });

    it("should handle missing input path error", async () => {
      await expect(compileCCommand("", outDir)).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith("Input path is required.");
    });

    it("should handle missing output directory error", async () => {
      await expect(compileCCommand(inPathC, "")).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        "Output directory path is required."
      );
    });
  });
});
