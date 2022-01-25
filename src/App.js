import './App.css';
import { useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    getPhantomWallet,
    getSolflareWallet,
    getSolletExtensionWallet,
    getSolletWallet,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import {CreateDistributor} from './components/CreateDistributor/CreateDistributor';
import {ClaimTokens} from './components/ClaimTokens/ClaimTokens';
import {CreateNFT} from './components/CreateNFT/CreateNFT';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

function App() {

  // WALLET ADAPTER
  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // const endpoint = "https://ssc-dao.genesysgo.net/";
  const wallets = useMemo(() => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolletWallet(),
      getSolletExtensionWallet(),
  ], []);

  return (
    <div className="App">
      <h1>Claim Tokens UI</h1>
      <div className="WalletWrapper">
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletMultiButton />
                    <WalletDisconnectButton />
                    <CreateDistributor />
                    <ClaimTokens />
                    <CreateNFT />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
      </div>
    </div>
  );
}

export default App;
