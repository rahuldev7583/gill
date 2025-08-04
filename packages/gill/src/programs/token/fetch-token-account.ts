import type { Mint, Token } from "@solana-program/token-2022";
import { fetchMint, fetchToken, findAssociatedTokenPda } from "@solana-program/token-2022";
import type { Account, Address, FetchAccountConfig, fetchEncodedAccount } from "@solana/kit";
import {
  isAddress,
  SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
  SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT,
  SolanaError,
} from "@solana/kit";

export function assertIsMint<TAddress extends string = string>(
  accountOrAddress: Account<Mint, TAddress> | Address<TAddress>,
): asserts accountOrAddress is Account<Mint, TAddress> {
  if (isAddress(accountOrAddress as Address)) {
    throw new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: accountOrAddress as Address });
  }

  if ("data" in accountOrAddress === false || "mintAuthority" in accountOrAddress.data === false) {
    throw new SolanaError(SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT, { address: accountOrAddress as Address });
  }
}

/**
 * Fetch the token account from a given `mint` and `owner` Address, automatically fetching the Mint account and deriving the
 * Associated Token Account's (ATA) address form the Mint's token program.
 *
 * @example
 * ```typescript
 * const { token, mint } = await fetchTokenAccount(
 *    rpc,
 *    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address, // (mint for USDC on mainnet)
 *    "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5" as Address, // owner address
 * );
 * ```
 */
export async function fetchTokenAccount<TMintAddress extends string = string, TOwner extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  mint: Address<TMintAddress> | Account<Mint>,
  owner: Address<TOwner>,
  config?: FetchAccountConfig,
): Promise<{ token: Account<Token>; mint: Account<Mint> }> {
  if (isAddress(mint as Address)) mint = await fetchMint(rpc, mint as Address);
  assertIsMint(mint);
  const [ata] = await findAssociatedTokenPda({
    mint: mint.address,
    owner,
    tokenProgram: mint.programAddress,
  });
  const token = await fetchToken(rpc, ata, config);
  return {
    token,
    mint,
  };
}
