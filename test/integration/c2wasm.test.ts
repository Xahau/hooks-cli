import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { buildCDir } from "../../src/c2wasm";
import { decodeBinary } from "../../src/2bytes/decodeBinary";

jest.mock("axios");
jest.mock("../../src/2bytes/decodeBinary");

describe("C directory builds", () => {
  const projectDir = path.join(process.cwd(), "test-c-build-project");
  const contractsDir = path.join(projectDir, "contracts");
  const includeDir = path.join(contractsDir, "include");
  const outDir = path.join(projectDir, "build");

  beforeEach(() => {
    jest.clearAllMocks();
    fs.mkdirSync(includeDir, { recursive: true });
    fs.writeFileSync(path.join(contractsDir, "base.c"), "int64_t hook() {}\n");
    fs.writeFileSync(path.join(includeDir, "macro.h"), "#define TEST 1\n");
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it("does not compile headers found below the source directory", async () => {
    (decodeBinary as jest.Mock).mockResolvedValue(new Uint8Array([0]));
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        message: "",
        output: "binary",
        tasks: [],
      },
    });

    await buildCDir(contractsDir, outDir, includeDir, false);

    expect(axios.post).toHaveBeenCalledTimes(1);
    const body = JSON.parse((axios.post as jest.Mock).mock.calls[0][1]);
    expect(body.files).toEqual([
      expect.objectContaining({ name: "base.c", type: "c" }),
    ]);
    expect(body.headers).toEqual([
      expect.objectContaining({ name: "macro.h", type: "h" }),
    ]);
  });
});
