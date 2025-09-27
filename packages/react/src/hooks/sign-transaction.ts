"use client";

import { useWalletAccountTransactionSigner } from "@solana/react";
import { getTransactionCodec, Transaction } from "gill";

import { useWallet } from "./wallet.js";

interface UseSignTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signTransaction: (tx: Transaction) => Promise<Uint8Array>;
  signer: ReturnType<typeof useWalletAccountTransactionSigner> | undefined;
}

export function useGillSignTransaction(): UseSignTransactionReturn {
  const { account } = useWallet();

  const chain = "solana:devnet";
  const signer = account ? useWalletAccountTransactionSigner(account, chain) : undefined;

  async function signTransaction(tx: Transaction): Promise<Uint8Array> {
    if (!account || !signer) throw new Error("Wallet not connected");
    console.log({ txFromHook: tx });

    // Sign the transaction
    const [signedTx] = await signer.modifyAndSignTransactions([tx]);
    console.log({ signedTxFromHook: signedTx });

    const codec = getTransactionCodec();
    const encodedTx = codec.encode(signedTx);

    return new Uint8Array(encodedTx);
  }

  return { account, signTransaction, signer };
}
