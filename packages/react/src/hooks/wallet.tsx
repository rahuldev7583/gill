"use client";

import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/react";
import { isSolanaChain } from "@solana/wallet-standard-chains";
import {
  StandardConnect,
  StandardConnectFeature,
  StandardDisconnect,
  StandardDisconnectFeature,
} from "@wallet-standard/features";
import { getWalletFeature, useWallets } from "@wallet-standard/react";
import type { UiWallet, UiWalletAccount } from "@wallet-standard/ui";
import {
  getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} from "@wallet-standard/ui-registry";
import type { WritableAtom } from "nanostores";
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

interface WalletContextValue {
  account: UiWalletAccount | undefined;
  connect: (uiWallet: UiWallet) => Promise<UiWalletAccount>;
  disconnect: (uiWallet: UiWallet) => Promise<void>;
  status: "idle" | "connecting" | "disconnecting";
  wallet: UiWallet | undefined;
  wallets: readonly UiWallet[];
}

interface WalletProviderConfig {
  autoConnect?: boolean;
  walletAllowList?: string[];
  onError?: (err: unknown) => void;
}

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const store = persistentAtom<string>("wallet:connected", "") as WritableAtom<string>;

export function WalletProvider({ children, config = {} }: { children: ReactNode; config?: WalletProviderConfig }) {
  const { autoConnect, walletAllowList, onError } = config;
  const storeValue = useStore(store);
  const allWallets = useWallets();

  const wallets = useMemo(() => {
    let list = allWallets.filter((w) => w.chains.some(isSolanaChain));
    if (walletAllowList?.length) {
      list = list.filter((w) => walletAllowList.includes(w.name));
    }
    return list;
  }, [allWallets, walletAllowList]);

  const [status, setStatus] = useState<"idle" | "connecting" | "disconnecting">("idle");

  const wallet = useMemo(() => {
    if (!storeValue) return undefined;
    const [walletName] = storeValue.split(":");
    return wallets.find((w) => w.name === walletName);
  }, [storeValue, wallets]);

  const account = useMemo(() => {
    if (!storeValue || !wallet) return undefined;
    const [, address] = storeValue.split(":");
    return wallet.accounts.find((a) => a.address === address);
  }, [storeValue, wallet]);

  const connect = async (uiWallet: UiWallet) => {
    if (status === "connecting") throw new Error("Already connecting");

    try {
      setStatus("connecting");
      const connectFeature = getWalletFeature(
        uiWallet,
        StandardConnect,
      ) as StandardConnectFeature[typeof StandardConnect];
      const wallet = getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(uiWallet);
      const result = await connectFeature.connect();

      const account = getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(
        wallet,
        result.accounts[0],
      );

      store.set(`${uiWallet.name}:${account.address}`);
      return account;
    } finally {
      setStatus("idle");
    }
  };

  const disconnect = async (uiWallet: UiWallet) => {
    if (status === "disconnecting") throw new Error("Already disconnecting");

    try {
      setStatus("disconnecting");
      const disconnectFeature = getWalletFeature(
        uiWallet,
        StandardDisconnect,
      ) as StandardDisconnectFeature[typeof StandardDisconnect];
      const result = await disconnectFeature.disconnect();

      store.set("");
      return result;
    } finally {
      setStatus("idle");
    }
  };

  useEffect(() => {
    if (autoConnect && wallet && !account) {
      connect(wallet).catch(onError);
    }
  }, [autoConnect, wallet]);

  return (
    <WalletContext.Provider
      value={{
        account,
        connect,
        disconnect,
        status,
        wallet,
        wallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
