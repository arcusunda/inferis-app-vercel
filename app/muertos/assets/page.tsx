'use client'

import Link from 'next/link';
import '@/app/globals.css';
import { useEffect, useState } from 'react';
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { useAccount } from "wagmi"
import ClipLoader from "react-spinners/ClipLoader";

const HomePage = () => {
  const { open } = useWeb3Modal()
  const { address } = useAccount()
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchNFTs(address as string);
    const savedNfts = localStorage.getItem('nfts');

    if (savedNfts) {
      setNfts(JSON.parse(savedNfts));
      localStorage.setItem('nfts', JSON.stringify(nfts));
    }
    setLoading(false);
  }, []);

  const fetchNFTs = async (address: string) => {
    try {
      const response = await fetch(`/api/alchemy/fetchmetadata?wallet=${address}`);
      const data = await response.json();
      if (response.ok) {
        setNfts(data.nfts);
        return data.nfts;
      } else {
        console.error('Error:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  };
    
  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
    <ul className="flex justify-center items-center space-x-4">
      <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
        <Link href="/muertos" className="text-white hover:text-gray-300">
          Home
        </Link>
      </li>
      <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
        <Link href="/muertos/storyelements/create" className="text-white hover:text-gray-300">
          Story Elements
        </Link>
      </li>
      <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/storyideas/" className="text-white hover:text-gray-300">
            Story Ideas
          </Link>
        </li>
      <li>
        <w3m-button />
      </li>
    </ul>
  </nav>
  );

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white">
        <ClipLoader color="#ffffff" loading={loading} size={50} />
        <p className="mt-4">Loading your muertos...</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="border rounded p-6 bg-gray-800 animate-pulse">
              <div className="h-3 bg-gray-700 mb-2 rounded"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-6">
      {renderNavigation()}
      {!address ? (
        <div className="flex flex-wrap justify-center gap-6">
          <p className="text-xl text-gray-500">Please connect your wallet</p>
        </div>
      ) : !nfts || nfts.length < 1 ? (
        <>
          <div className="flex flex-wrap justify-center gap-6">
            <p className="text-xl text-gray-500">No Muertos found</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <p className="text-xl text-gray-500">Visit Los Muertos World</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <p className="text-xl text-gray-500"> at </p>
          </div>
          <div className="flex justify-center items-center space-x-4">
            <Link href="https://opensea.io/collection/los-muertos-world" target="_blank">
              <img src="/opensea-logo.png" alt="Visit Los Muertos World at OpenSea" className="w-10 h-10" />
            </Link>
            <p className="text-xl text-gray-500"> or </p>
            <Link href="https://magiceden.io/collections/ethereum/0xc878671ff88f1374d2186127573e4a63931370fc" target="_blank">
              <img src="/magiceden-logo.png" alt="Visit Los Muertos World at Magic Eden" className="w-10 h-10" />
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {nfts.map((nft: { tokenId: string; image: string; name: string; owner: string; stakedAt: string; attributes: { trait_type: string; value: string; }[] }, index) => (
            nft && (
              <Link href={`/muertos/assets/${nft.tokenId}`} key={index} className="border border-gray-300 rounded-lg p-4 max-w-xs text-center">
                <img
                  src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  alt={`Token ID: ${nft.tokenId}`}
                  className="w-40 h-auto rounded mb-4"
                />
                <div className="text-sm text-gray-400">
                  <p><strong>Name:</strong> {nft.name}</p>
                  <p><strong>Token ID:</strong> {nft.tokenId}</p>
                  {nft.attributes && (
                    <div>
                      <p><strong>Mask:</strong> {nft.attributes.find(attr => attr.trait_type === 'Mask')?.value || 'N/A'}</p>
                      <p><strong>Body:</strong> {nft.attributes.find(attr => attr.trait_type === 'Body')?.value || 'N/A'}</p>
                      <p><strong>Expression:</strong> {nft.attributes.find(attr => attr.trait_type === 'Expression')?.value || 'N/A'}</p>
                      <p><strong>Headwear:</strong> {nft.attributes.find(attr => attr.trait_type === 'Headwear')?.value || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </Link>
            )
          ))}
        </div>
      )}
    </main>
  );
  };

export default HomePage;
