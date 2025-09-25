/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import {
  appendTransactionMessageInstruction,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
} from "gill";

import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

interface UseSignTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signTransaction: (instructions: any[]) => Promise<any>;
  signer: ReturnType<typeof useWalletAccountTransactionSendingSigner> | undefined;
}

export function useSignTransaction(): UseSignTransactionReturn {
  const { account } = useWallet();
  const { rpc } = useSolanaClient();

  const chain = (account?.chains[0] ?? "solana:devnet") as `solana:${string}`;

  const signer = account ? useWalletAccountTransactionSendingSigner(account, chain) : undefined;

  async function signTransaction(instructions: any[]) {
    if (!account || !signer) throw new Error("Wallet not connected");

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    let message: any = createTransactionMessage({ version: "legacy" });
    message = setTransactionMessageFeePayerSigner(signer, message);
    message = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message);

    for (const ix of instructions) {
      message = appendTransactionMessageInstruction(ix, message);
    }

    return await signAndSendTransactionMessageWithSigners(message);
  }

  return { account, signTransaction, signer };
}
