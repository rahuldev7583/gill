"use client";

import { useWalletAccountTransactionSigner } from "@solana/react";
import { getTransactionCodec, Transaction } from "gill";
import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

interface UseSignTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signAllTransaction: (tx: Transaction[]) => Promise<Uint8Array[]>;
  signer: ReturnType<typeof useWalletAccountTransactionSigner> | undefined;
}

export function useGillSignAllTransaction(): UseSignTransactionReturn {
  const {account } = useWallet();
  const {cluster} = useSolanaClient();

  const signer = account ? useWalletAccountTransactionSigner(account, `solana:${cluster}`) : undefined;

  async function signAllTransaction(txs: Transaction[]): Promise<Uint8Array[]> {
    if (!account || !signer) throw new Error("Wallet not connected");
    const codec = getTransactionCodec();
    const encodedTxs: Uint8Array[] = [];

    for (const tx of txs) {        
        const signedTx = await signer.modifyAndSignTransactions([tx]); 
        encodedTxs.push(new Uint8Array(codec.encode(signedTx[0])));
    }
        return encodedTxs;
    }

  return { account, signAllTransaction, signer };
}