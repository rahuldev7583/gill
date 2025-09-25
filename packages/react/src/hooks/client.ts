import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSolanaClient, type SolanaClient } from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";

type Cluster = "devnet" | "localnet" | "mainnet" | "testnet";

export interface ExtendedSolanaClient extends SolanaClient {
  cluster: Cluster;
}

/**
 * Get the current Solana client (including `rpc` and `rpcSubscriptions`)
 */
export function useSolanaClient(): ExtendedSolanaClient {
  const { data: config } = useQuery<ExtendedSolanaClient>({
    // fallback data should not be reached if used within `SolanaProvider`
    // since we set the initial value. but just in case => devnet
    initialData: {
      ...createSolanaClient({ urlOrMoniker: "devnet" }),
      cluster: "devnet",
    },

    queryKey: [GILL_HOOK_CLIENT_KEY],

    staleTime: Infinity,
  });
  return config;
}

/**
 * Update your Solana client (including `rpc` and `rpcSubscriptions`)
 */
export function useUpdateSolanaClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newClient: SolanaClient): Promise<SolanaClient> => {
      queryClient.setQueryData([GILL_HOOK_CLIENT_KEY], newClient);
      return newClient;
    },
    onSuccess: () => {
      // Invalidate any queries that might depend on the Solana client
      queryClient.invalidateQueries({ queryKey: [GILL_HOOK_CLIENT_KEY] });

      /**
       * todo: research more here
       * removing queries here will force the cache to update automatically, but can result in the waterfall of data fetching
       * but it seems that without it, the client side data does not auto refetch when the SolanaClient is changed :/
       */
      // queryClient.removeQueries({
      //   predicate: (query) => {
      //     return query.queryKey.length >= 2 && query.queryKey[0] === GILL_HOOK_CLIENT_KEY;
      //   },
      // });

      queryClient.prefetchQuery({ queryKey: [GILL_HOOK_CLIENT_KEY] });
      queryClient.refetchQueries({
        queryKey: [GILL_HOOK_CLIENT_KEY],
      });
    },
  });
}
