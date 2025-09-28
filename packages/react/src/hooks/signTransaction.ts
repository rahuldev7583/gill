"use client";

import { useWalletAccountTransactionSigner } from "@solana/react";
import { getTransactionCodec, Transaction } from "gill";
import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

interface UseSignTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signTransaction: (tx: Transaction) => Promise<Uint8Array>;
  signer: ReturnType<typeof useWalletAccountTransactionSigner> | undefined;
}

export function useGillSignTransaction(): UseSignTransactionReturn {
  const { account } = useWallet();
  const {cluster} = useSolanaClient();

  const signer = account ? useWalletAccountTransactionSigner(account, `solana:${cluster}`) : undefined;

  async function signTransaction(tx: Transaction): Promise<Uint8Array> {
    if (!account || !signer) throw new Error("Wallet not connected");

    const [signedTx] = await signer.modifyAndSignTransactions([tx]);

    const codec = getTransactionCodec();
    const encodedTx = codec.encode(signedTx);

    return new Uint8Array(encodedTx);
  }

  return { account, signTransaction, signer };
}