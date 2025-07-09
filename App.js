import { useEffect, useState } from 'react';
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connection, setConnection] = useState(null);
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const conn = new Connection(clusterApiUrl('devnet'));
    setConnection(conn);
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana && solana.isPhantom) {
        const response = await solana.connect({ onlyIfTrusted: true });
        setWalletAddress(response.publicKey.toString());
        getBalance(response.publicKey);
      }
    } catch (err) {
      console.error('Wallet check failed:', err);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
      getBalance(response.publicKey);
    }
  };

  const getBalance = async (publicKey) => {
    const bal = await connection.getBalance(publicKey);
    setBalance(bal / LAMPORTS_PER_SOL);
  };

  const sendSol = async () => {
    try {
      const fromPubKey = new PublicKey(walletAddress);
      const toPubKey = new PublicKey(receiver);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubKey,
          toPubkey: toPubKey,
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      transaction.feePayer = fromPubKey;
      transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      await connection.confirmTransaction(signature);
      alert('Transaction successful: ' + signature);
      getBalance(fromPubKey);
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Solana Wallet dApp Demo</h1>
      {walletAddress ? (
        <>
          <p>Wallet: {walletAddress}</p>
          <p>Balance: {balance} SOL</p>
          <div>
            <input
              placeholder="Receiver Address"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
            />
            <input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={sendSol}>Send SOL</button>
          </div>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Phantom Wallet</button>
      )}
    </div>
  );
}