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
    if (!solana || !solana.isPhantom) {
      alert("Please install the Phantom Wallet extension.");
      return;
    }

    try {
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
      getBalance(response.publicKey);
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const getBalance = async (publicKey) => {
    const bal = await connection.getBalance(publicKey);
    setBalance((bal / LAMPORTS_PER_SOL).toFixed(4));
  };

  const sendSol = async () => {
    try {
      if (!receiver || !amount || isNaN(amount)) {
        alert("Please enter a valid receiver address and amount.");
        return;
      }

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
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      await connection.confirmTransaction(signature);
      alert('✅ Transaction successful!\nSignature: ' + signature);

      getBalance(fromPubKey);
      setAmount('');
      setReceiver('');
    } catch (error) {
      console.error('Transaction error:', error);
      alert('❌ Transaction failed. Check console.');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>🔥 Solana dApp Demo</h1>

      {walletAddress ? (
        <>
          <p><strong>Wallet:</strong> {walletAddress}</p>
          <p><strong>Balance:</strong> {balance} SOL</p>

          <div style={{ marginTop: '1rem' }}>
            <input
              style={{ marginRight: '10px' }}
              placeholder="Receiver Address"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
            />
            <input
              style={{ marginRight: '10px', width: '80px' }}
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
