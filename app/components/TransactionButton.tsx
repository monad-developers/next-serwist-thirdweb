"use client";

import { useState, useCallback, useEffect } from "react";
import { useSendTransaction, useActiveAccount, useWalletBalance } from "thirdweb/react";
import { prepareTransaction } from "thirdweb";
import { monadTestnet } from "thirdweb/chains";
import { toWei } from "thirdweb/utils";
import { client } from "../client";


export default function TransactionButton() {
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  
  const { mutate: sendTransaction, data: transactionData, isPending } = useSendTransaction();
  const activeAccount = useActiveAccount();
  
  // Get native MON balance
  const { data: monBalance, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance({
    client,
    address: activeAccount?.address,
    chain: monadTestnet,
  });

  useEffect(() => {
    if (transactionData?.transactionHash) {
      setTransactionStatus('success');
      // Refresh balance after successful transaction
      setTimeout(() => {
        refetchBalance();
      }, 3000);
    }
  }, [transactionData, refetchBalance]);

  useEffect(() => {
    if (isPending) {
      setTransactionStatus('pending');
    }
  }, [isPending]);

  const copyToClipboard = useCallback(async () => {
    if (!activeAccount?.address) return;
    
    try {
      await navigator.clipboard.writeText(activeAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  }, [activeAccount?.address]);

  const onSendTransaction = async () => {
    if (!recipientAddress || !amount || !activeAccount) {
      alert("Please enter recipient address and amount");
      return;
    }

    try {
      setTransactionStatus('pending');
      
      // Convert amount to wei (18 decimals for MON)
      const amountInWei = toWei(amount);

      const transaction = prepareTransaction({
        client,
        chain: monadTestnet,
        to: recipientAddress as `0x${string}`,
        value: amountInWei,
      });

      sendTransaction(transaction, {
        onError: (error) => {
          console.error("Transaction failed:", error);
          setTransactionStatus('error');
        }
      });
    } catch (error) {
      console.error("Transaction preparation failed:", error);
      setTransactionStatus('error');
    }
  };

  if (!activeAccount) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
          <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
            💳
          </span>
          MON Transfer
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-center">
          Please connect your wallet first to send MON transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
        <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
          💳
        </span>
        MON Transfer on Monad Testnet
      </h3>

      {/* Wallet Info Section */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Your Address</label>
          <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 flex items-center justify-between gap-3">
            <span className="font-mono text-sm text-slate-800 dark:text-slate-200 break-all">
              {activeAccount.address}
            </span>
            <button
              onClick={copyToClipboard}
              className="flex-shrink-0 p-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300 transition-colors duration-200"
              title={copied ? "Copied!" : "Copy address"}
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">MON Balance</label>
            <button
              onClick={() => refetchBalance()}
              disabled={balanceLoading}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                balanceLoading 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className={balanceLoading ? 'animate-spin' : ''}>
                {balanceLoading ? "⟳" : "↻"}
              </span>
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {balanceLoading ? (
                <span className="text-slate-500 dark:text-slate-400">Loading...</span>
              ) : (
                `${parseFloat(monBalance?.displayValue || "0").toFixed(4)} MON`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            Amount (MON)
          </label>
          <div className="space-y-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.001"
              min="0"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAmount("0.001")}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors duration-200"
              >
                0.001 MON
              </button>
              <button
                type="button"
                onClick={() => setAmount("0.01")}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors duration-200"
              >
                0.01 MON
              </button>
              <button
                type="button"
                onClick={() => setAmount("0.1")}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors duration-200"
              >
                0.1 MON
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onSendTransaction}
          disabled={!recipientAddress || !amount || transactionStatus === 'pending' || parseFloat(amount) <= 0}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
            !recipientAddress || !amount || transactionStatus === 'pending' || parseFloat(amount) <= 0
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {transactionStatus === 'pending' ? 'Sending MON...' : `Send ${amount || '0'} MON`}
        </button>

        {/* Transaction Status */}
        {transactionStatus !== 'idle' && (
          <div className="mt-4 space-y-2">
            {transactionStatus === 'pending' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin mr-3 w-5 h-5 border-2 border-yellow-500 dark:border-yellow-400 border-t-transparent rounded-full"></div>
                  <span className="text-yellow-800 dark:text-yellow-200 font-medium">Transaction pending...</span>
                </div>
              </div>
            )}
            
            {transactionStatus === 'success' && transactionData?.transactionHash && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-green-800 dark:text-green-200 font-medium mr-2">✅ MON sent successfully!</span>
                  </div>
                  <div className="flex items-center justify-between bg-green-100 dark:bg-green-800/30 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Transaction Hash:</p>
                      <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">{transactionData.transactionHash}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://testnet.monadscan.com/tx/${transactionData.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      View on MonadScan
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {transactionStatus === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-red-800 dark:text-red-200 font-medium">❌ Transaction failed. Please try again.</span>
                  <button
                    onClick={() => setTransactionStatus('idle')}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors duration-200"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
