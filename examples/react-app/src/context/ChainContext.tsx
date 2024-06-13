import type { ClusterUrl } from '@solana/web3.js';
import { devnet, mainnet, testnet } from '@solana/web3.js';
import React, { createContext, useMemo, useState } from 'react';

import { localStorage } from '../storage';

const STORAGE_KEY = 'solana-wallet-standard-example-react:selected-chain';

type Context = Readonly<{
    chain: `solana:${string}`;
    displayName: string;
    setChain?(chain: 'solana:${string}'): void;
    solanaExplorerClusterName: 'devnet' | 'mainnet-beta' | 'testnet';
    solanaRpcSubscriptionsUrl: ClusterUrl;
    solanaRpcUrl: ClusterUrl;
}>;

export const ChainContext = createContext<Context>({
    chain: 'solana:devnet',
    displayName: 'Devnet',
    solanaExplorerClusterName: 'devnet',
    solanaRpcSubscriptionsUrl: devnet('wss://api.devnet.solana.com'),
    solanaRpcUrl: devnet('https://api.devnet.solana.com'),
});

export function ChainContextProvider({ children }: { children: React.ReactNode }) {
    const [chain, setChain] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'solana:devnet');
    const contextValue = useMemo<Context>(() => {
        switch (chain) {
            case 'solana:mainnet':
                return {
                    chain: 'solana:mainnet',
                    displayName: 'Mainnet Beta',
                    solanaExplorerClusterName: 'mainnet-beta',
                    solanaRpcSubscriptionsUrl: mainnet('wss://api.mainnet-beta.solana.com'),
                    solanaRpcUrl: mainnet('https://api.mainnet-beta.solana.com'),
                };
            case 'solana:testnet':
                return {
                    chain: 'solana:testnet',
                    displayName: 'Testnet',
                    solanaExplorerClusterName: 'testnet',
                    solanaRpcSubscriptionsUrl: testnet('wss://api.testnet.solana.com'),
                    solanaRpcUrl: testnet('https://api.testnet.solana.com'),
                };
            case 'solana:devnet':
            default:
                if (chain !== 'solana:devnet') {
                    localStorage.removeItem(STORAGE_KEY);
                    console.error(`Unrecognized chain \`${chain}\``);
                }
                return {
                    chain: 'solana:devnet',
                    displayName: 'Devnet',
                    solanaExplorerClusterName: 'devnet',
                    solanaRpcSubscriptionsUrl: devnet('wss://api.devnet.solana.com'),
                    solanaRpcUrl: devnet('https://api.devnet.solana.com'),
                };
        }
    }, [chain]);
    return (
        <ChainContext.Provider
            value={useMemo(
                () => ({
                    ...contextValue,
                    setChain(chain) {
                        localStorage.setItem(STORAGE_KEY, chain);
                        setChain(chain);
                    },
                }),
                [contextValue],
            )}
        >
            {children}
        </ChainContext.Provider>
    );
}
