/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import { createTransaction, signTransactionMessageWithSigners } from "gill";

import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

interface UseSignTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signTransaction: (instructions: any[]) => Promise<any>;
  signer: ReturnType<typeof useWalletAccountTransactionSendingSigner> | undefined;
}

export function useGillSignTransaction(): UseSignTransactionReturn {
  const { account } = useWallet();
  const { rpc, cluster } = useSolanaClient();

  console.log({ account });

  const chain = `solana:${cluster}` as const;
  const signer = account ? useWalletAccountTransactionSendingSigner(account, chain) : undefined;

  async function signTransaction(instructions: any[]) {
    if (!account || !signer) throw new Error("Wallet not connected");
    console.log({ account });
    console.log({ cluster, rpc });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const tx = createTransaction({
      feePayer: signer,
      instructions,
      latestBlockhash,
      version: "legacy",
    });

    return await signTransactionMessageWithSigners(tx);
  }

  return { account, signTransaction, signer };
}
