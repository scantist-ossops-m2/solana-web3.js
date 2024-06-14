import type { UiWallet, UiWalletAccount } from '@wallet-standard/react';
import {
    getUiWalletAccountStorageKey,
    uiWalletAccountBelongsToUiWallet,
    uiWalletAccountsAreSame,
    useWallets,
} from '@wallet-standard/react';
import { createContext, useEffect, useMemo, useState } from 'react';

import { localStorage } from '../storage';

type State = UiWalletAccount | undefined;

const STORAGE_KEY = 'solana-wallet-standard-example-react:selected-wallet-and-address';

export const SelectedWalletAccountContext = createContext<
    readonly [selectedWalletAccount: State, setSelectedWalletAccount: React.Dispatch<React.SetStateAction<State>>]
>([
    undefined,
    () => {
        /* empty */
    },
]);

let wasSetInvoked = false;
function getSavedWalletAccount(wallets: readonly UiWallet[]): UiWalletAccount | undefined {
    if (wasSetInvoked) {
        // After the user makes an explicit choice of wallet, stop trying to auto-select the
        // saved wallet, if and when it appears.
        return;
    }
    try {
        const savedWalletNameAndAddress = localStorage.getItem(STORAGE_KEY);
        if (!savedWalletNameAndAddress || typeof savedWalletNameAndAddress !== 'string') {
            return;
        }
        const [savedWalletName, savedAccountAddress] = savedWalletNameAndAddress.split(':');
        if (!savedWalletName || !savedAccountAddress) {
            return;
        }
        for (const wallet of wallets) {
            if (wallet.name === savedWalletName) {
                for (const account of wallet.accounts) {
                    if (account.address === savedAccountAddress) {
                        return account;
                    }
                }
            }
        }
    } catch {
        return;
    }
}

export function SelectedWalletAccountContextProvider({ children }: { children: React.ReactNode }) {
    const wallets = useWallets();
    const [selectedWalletAccount, setSelectedWalletAccountInternal] = useState<State>(() =>
        getSavedWalletAccount(wallets),
    );
    const setSelectedWalletAccount: React.Dispatch<React.SetStateAction<State>> = s => {
        setSelectedWalletAccountInternal(prevSelectedWalletAccount => {
            wasSetInvoked = true;
            const nextWalletAccount = typeof s === 'function' ? s(prevSelectedWalletAccount) : s;
            const accountKey = nextWalletAccount ? getUiWalletAccountStorageKey(nextWalletAccount) : undefined;
            try {
                if (accountKey) {
                    localStorage.setItem(STORAGE_KEY, accountKey);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch {
                /* empty */
            }
            return nextWalletAccount;
        });
    };
    useEffect(() => {
        const savedWalletAccount = getSavedWalletAccount(wallets);
        if (savedWalletAccount) {
            setSelectedWalletAccountInternal(savedWalletAccount);
        }
    }, [wallets]);
    const walletAccount = useMemo(() => {
        if (selectedWalletAccount) {
            for (const uiWallet of wallets) {
                for (const uiWalletAccount of uiWallet.accounts) {
                    if (uiWalletAccountsAreSame(selectedWalletAccount, uiWalletAccount)) {
                        return uiWalletAccount;
                    }
                }
                if (uiWalletAccountBelongsToUiWallet(selectedWalletAccount, uiWallet) && uiWallet.accounts[0]) {
                    // If the selected account belongs to this connected wallet, at least, then
                    // select one of its accounts.
                    return uiWallet.accounts[0];
                }
            }
        }
    }, [selectedWalletAccount, wallets]);
    useEffect(() => {
        // If there is a selected wallet account but the wallet to which it belongs has since
        // disconnected, clear the selected wallet.
        if (selectedWalletAccount && !walletAccount) {
            setSelectedWalletAccountInternal(undefined);
        }
    }, [selectedWalletAccount, walletAccount]);
    return (
        <SelectedWalletAccountContext.Provider
            value={useMemo(() => [walletAccount, setSelectedWalletAccount] as const, [walletAccount])}
        >
            {children}
        </SelectedWalletAccountContext.Provider>
    );
}
