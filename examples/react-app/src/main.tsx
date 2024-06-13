import './index.css';
import '@radix-ui/themes/styles.css';

import { Flex, Section, Theme } from '@radix-ui/themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Nav } from './components/Nav.tsx';
import { ChainContextProvider } from './context/ChainContext.tsx';
import { RpcContextProvider } from './context/RpcContext.tsx';
import { SelectedWalletAccountContextProvider } from './context/SelectedWalletAccountContext.tsx';
import Root from './routes/root.tsx';

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);
root.render(
    <StrictMode>
        <Theme>
            <Flex direction="column">
                <ChainContextProvider>
                    <SelectedWalletAccountContextProvider>
                        <RpcContextProvider>
                            <Nav />
                            <Section>
                                <Root />
                            </Section>
                        </RpcContextProvider>
                    </SelectedWalletAccountContextProvider>
                </ChainContextProvider>
            </Flex>
        </Theme>
    </StrictMode>,
);
