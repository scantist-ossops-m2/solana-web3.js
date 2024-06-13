import { Text } from '@radix-ui/themes';
import { AccountNotificationsApi, Address, address, GetBalanceApi, Rpc, RpcSubscriptions } from '@solana/web3.js';
import type { UiWalletAccount } from '@wallet-standard/react';
import { useCallback, useContext } from 'react';
import useSWRSubscription, { SWRSubscription } from 'swr/subscription';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

function balanceSubscribe(
    rpc: Rpc<GetBalanceApi>,
    rpcSubscriptions: RpcSubscriptions<AccountNotificationsApi>,
    { address }: { address: Address },
    { next }: { next(error: unknown, value?: bigint): void },
) {
    const abortController = new AbortController();
    let lastUpdateSlot = 0n;
    // Fetch the current balance of this account.
    rpc.getBalance(address, { commitment: 'confirmed' })
        .send({ abortSignal: abortController.signal })
        .then(({ context: { slot }, value: lamports }) => {
            if (slot < lastUpdateSlot) {
                // This implies that we already received an update newer than this one (ie. from the
                // subscription below).
                return;
            }
            lastUpdateSlot = slot;
            next(null, lamports);
        })
        .catch(e => next(e));
    // Subscribe for updates to that balance.
    rpcSubscriptions
        .accountNotifications(address)
        .subscribe({ abortSignal: abortController.signal })
        .then(async accountInfoNotifications => {
            try {
                for await (const {
                    context: { slot },
                    value,
                } of accountInfoNotifications) {
                    if (slot < lastUpdateSlot) {
                        // This implies that we already received an update newer than this one (ie.
                        // from the fetch above).
                        continue;
                    }
                    lastUpdateSlot = slot;
                    next(null, value.lamports);
                }
            } catch (e) {
                next(e);
            }
        })
        .catch(e => next(e));
    return () => abortController.abort();
}

export function Balance({ account }: Props) {
    const { chain } = useContext(ChainContext);
    const { rpc, rpcSubscriptions } = useContext(RpcContext);
    const subscribe = useCallback<SWRSubscription<{ address: Address }, bigint>>(
        (...args) => balanceSubscribe(rpc, rpcSubscriptions, ...args),
        [rpc, rpcSubscriptions],
    );
    const { data: lamports } = useSWRSubscription({ address: address(account.address), chain }, subscribe);
    if (lamports == null) {
        return <Text>&ndash;</Text>;
    } else {
        const formattedSolValue = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(
            // @ts-expect-error This format string is 100% allowed now.
            `${lamports}E-9`,
        );
        return <Text>{`${formattedSolValue} \u25CE`}</Text>;
    }
}
