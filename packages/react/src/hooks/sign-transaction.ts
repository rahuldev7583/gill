/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { Transaction } from "gill";
import { getTransactionCodec } from "gill";

import { useWallet } from "./wallet.js";

export function useGillSignTransaction() {
  const { account } = useWallet();
  const codec = getTransactionCodec();

  async function signTransaction(tx: Transaction): Promise<Uint8Array> {
    if (!account) throw new Error("Wallet not connected");
    console.log({ accountFromHook: account });

    console.log({ txFromHook: tx });

    try {
      // Encode the Transaction → Uint8Array
      console.log("trying to encode");

      const txBytes = codec.encode(tx);
      console.log({ txBytesFromHook: txBytes });

      // @ts-expect-error wallet-standard method exists
      const signed: Uint8Array = await account.signTransaction(txBytes);

      console.log({ signedFromHook: signed });

      return signed;
    } catch (error: any) {
      // Map errors in a friendly way
      console.error("Transaction signing failed:", error);
      throw new Error(error?.message || "Failed to sign transaction");
    }
  }

  return { account, signTransaction };
}
