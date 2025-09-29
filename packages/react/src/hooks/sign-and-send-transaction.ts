"use client";

import { useWalletAccountTransactionSigner } from "@solana/react";
import { Base64EncodedWireTransaction, getTransactionCodec, Signature, Transaction } from "gill";
import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

interface UseSignAndSendTransactionReturn {
  account: ReturnType<typeof useWallet>["account"];
  signAndSendTransaction: (tx: Transaction) => Promise<Signature>;
  signer: ReturnType<typeof useWalletAccountTransactionSigner> | undefined;
}

function toBase64EncodedWireTransaction(
    bytes: Uint8Array
  ): Base64EncodedWireTransaction {
    const base64 = Buffer.from(bytes).toString('base64');
    return base64 as Base64EncodedWireTransaction;
  }
  
export function useGillSignAndSendTransaction(): UseSignAndSendTransactionReturn {
  const { account } = useWallet();
  const {cluster, rpc} = useSolanaClient();

  const signer = account ? useWalletAccountTransactionSigner(account, `solana:${cluster}`) : undefined;

  async function signAndSendTransaction(tx: Transaction): Promise<Signature> {
    if (!account || !signer) throw new Error("Wallet not connected");

    const [signedTx] = await signer.modifyAndSignTransactions([tx]);

    const codec = getTransactionCodec();
    const encodedTx = codec.encode(signedTx);

    const signedTxBase64 = toBase64EncodedWireTransaction(new Uint8Array(encodedTx));
    
    const response = await rpc
        .sendTransaction(signedTxBase64, {
          encoding: 'base64',
          preflightCommitment: 'confirmed',
          skipPreflight: false,
        })
        .send();
        
    return response;
  }

  return { account, signAndSendTransaction, signer };
}