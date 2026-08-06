import { Client, Wallet, Invoke, TransactionMetadata } from "xahau";
import { HookFlags } from "xahau/dist/npm/models/common/xahau";
import {
  createHookPayload,
  setHooksV3,
  SetHookParams,
  Xrpld,
  ExecutionUtility,
} from "@xahau/hooks-toolkit";
import "dotenv/config";

export async function main(): Promise<void> {
  const client = new Client(process.env.XRPLD_WSS || "");
  await client.connect();

  const aliceWallet = Wallet.fromSeed(process.env.ALICE_SEED || "");

  const hook = createHookPayload({
    version: 1,
    createFile: "base",
    namespace: "base",
    flags: HookFlags.hsfOverride,
    hookOnArray: ["Invoke"],
    fee: "100000",
  });

  await setHooksV3({
    client: client,
    wallet: aliceWallet,
    hooks: [{ Hook: hook }],
  } as SetHookParams);

  const builtTx: Invoke = {
    TransactionType: "Invoke",
    Account: aliceWallet.classicAddress,
  };
  const result = await Xrpld.submit(client, {
    wallet: aliceWallet,
    tx: builtTx,
    debugStream: true,
  });

  const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
    client,
    result.meta as TransactionMetadata
  );
  console.log(hookExecutions.executions[0].HookReturnString);
  await client.disconnect();
}

main();
