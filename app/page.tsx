"use client";
import { useState } from 'react';
import { Address, custom } from 'viem';
import { connectMetaMask } from '../utils/metamask';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { StoryProtocolApiBaseUri, StoryProtocolApiChain, StoryProtocolApiKey,  
  NFTContractAddress, WBNFTContractAddress, IpfsBaseUrl, 
  WorldBuildingPassMintingPage, WorldName } from '../utils/utils';
import axios from "axios";
import { StoryElement } from './types';
import { OwnedNft } from "alchemy-sdk";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipLoader } from "react-spinners";
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function Home() {
  const [address, setAddress] = useState<Address | null>(null);
  const [ipAsset, setIpAsset] = useState(null);
  const [storyElement, setStoryElement] = useState<StoryElement | null>(null);
  const [client, setClient] = useState<StoryClient | null>(null);
  const [storyElements, setStoryElements] = useState([]);
  const [storyElementToNftMap, setStoryElementToNftMap] = useState(new Map());
  const [nfts, setNfts] = useState<OwnedNft[]>([]);
  const [fetchedStoryElements, setFetchedStoryElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isHolder, setIsHolder] = useState(false);
  const [loadStoryElements, setLoadStoryElements] = useState(false);
  const router = useRouter();
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  require('dotenv').config();

  const connectAndFetch = async (account: Address) => {
   try {
      const response = await axios.get('/api/alchemy', {
        params: {
          wallet: account,
          contractAddress: NFTContractAddress,
        },
      });
      
      const isHolderOfNFTContract = response.data.isHolderOfContract;

      const responseWb = await axios.get('/api/alchemy', {
        params: {
          wallet: account,
          contractAddress: WBNFTContractAddress,
        },
      });

      const isHolderOfWorldBuildingPassContract = responseWb.data.isHolderOfContract;

      if (isHolderOfNFTContract || isHolderOfWorldBuildingPassContract) {
        setIsHolder(true);
      } else {
        setIsHolder(false);
      }
    } finally {
      setLoading(false);
    }
};

  const fetchNfts = async (account: string) => {
    try {
      const response = await axios.get('/api/alchemy', {
        params: {
          wallet: account,
          contractAddress: NFTContractAddress,
        },
      });
  
      const filteredNfts = response.data.nfts;
  
      setNfts(filteredNfts);
  
      const map = new Map();
      const fetchedStoryElements = [];
  
      for (const nft of filteredNfts) {
        const response = await fetch(`/api/storyelements/${encodeURI(nft.name ? nft.name : 'Unknown name')}`);
        const data = await response.json();
  
        const storyElement = {
          ...data,
          dateCanonized: data.dateCanonized ? new Date(data.dateCanonized) : undefined,
          dateRegistered: data.dateRegistered ? new Date(data.dateRegistered) : undefined,
          created: new Date(data.created),
          updated: data.updated ? new Date(data.updated) : undefined,
        };

        fetchedStoryElements.push(storyElement);
  
        map.set(storyElement.id, { storyElement, nft });
      }
  
      setStoryElementToNftMap(map);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  };
  
  const handleLoadStoryElements = async () => {
    if (account && account.address) {
      fetchNfts(account.address);
      setLoadStoryElements(true);
    }
  };

  const fetchStoryProtocolData = async (storyElement: StoryElement) => {
    if (storyElement.ipId) {
      const storyProtocolResponse = await fetch(`${StoryProtocolApiBaseUri}/api/v1/assets/${storyElement.ipId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          "X-API-Key": StoryProtocolApiKey,
          "X-CHAIN": StoryProtocolApiChain,
        },
      });
      const storyProtocolData = await storyProtocolResponse.json();

      if (storyProtocolResponse.ok && storyProtocolData.data.id === storyElement.ipId) {
        storyElement.isRegistered = true;
      } else {
        storyElement.isRegistered = false;
      }
    }

    return storyElement;
  };

  const handleRegister = async (storyElementName: string) => {
    setLoading(true);
    const storyElement = await fetchData(storyElementName);

    try {
      const account: Address = await connectMetaMask();

      try {
        if (!account || !storyElement) return;

        const config: StoryConfig = {
          account: account,
          transport: custom(window.ethereum),
          chainId: 'sepolia',
        }
        const client = StoryClient.newClient(config)
        const tokenId = storyElement ? storyElement.id : 1;

        const registeredIpAssetResponse = await client.ipAsset.register({
          nftContract: NFTContractAddress,
          tokenId: tokenId,
          txOptions: { waitForTransaction: true }
        });

        const response = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: storyElement.id, ipId: registeredIpAssetResponse.ipId, state: 'Registered', isRegistered: true })
        });

        if (response.ok) {
          const updatedStoryElement = {
            ...storyElement,
            state: 'Registered',
            isRegistered: true,
            dateRegistered: new Date(),
            ipId: registeredIpAssetResponse.ipId,
          };

          setStoryElementToNftMap((prevMap) => {
            const updatedMap = new Map(prevMap);
            const elementData = updatedMap.get(storyElement.id);
            if (elementData) {
              elementData.storyElement = updatedStoryElement;
              updatedMap.set(storyElement.id, elementData);
            }
            return updatedMap;
          });
        } else {
          console.error('Failed to update story element:', response.statusText);
        }
      } catch (error) {
        console.log(error);
        throw error;
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to register IP Asset:', error);
    }
  };

  const fetchData = async (storyElementName: string): Promise<StoryElement | null> => {
    const response = await fetch(`/api/storyelements/${encodeURI(storyElementName)}`);
    if (response.ok) {
      const data = await response.json();

      const storyElement: StoryElement = {
        ...data,
        dateCanonized: data.dateCanonized ? new Date(data.dateCanonized) : undefined,
        dateRegistered: data.dateRegistered ? new Date(data.dateRegistered) : undefined,
        created: new Date(data.created),
        updated: data.updated ? new Date(data.updated) : undefined,
      };
      return storyElement;
    } else {
      console.error('Failed to fetch StoryElement:', response.statusText);
      return null;
    }
  };

  const getImageUrl = (ipfsUrl: string) => {
    if (ipfsUrl.startsWith('ipfs://')) {
      const url = ipfsUrl.replace('ipfs://', `${IpfsBaseUrl}/`);
      return url;
    }
    return ipfsUrl;
  };
  
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white">
        <ClipLoader color="#ffffff" loading={loading} size={50} />
        <p className="mt-4">Loading your info...</p>
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

  const renderBanner = () => (
    <img
      src="story-element-logo.jpg"
      alt="Welcome"
      className="w-1600 h-500 object-cover mx-auto"
    />
  );

  const renderWelcomeContent = () => (
    <div className="text-center">
      {renderBanner()}
      <h2 className="text-xl sm:text-3xl font-bold mt-2 sm:mt-4">Welcome to Story Element</h2>
      <p className="mt-2 sm:mt-4 p-2 sm:p-4 bg-gray-200 dark:bg-gray-800 rounded text-center text-sm sm:text-lg leading-5 sm:leading-7">
        Story Element is a world building collaboration app that uses AI to assist creators in collaboratively forming a narrative universe.
      </p>
    </div>
  );
  
  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
    <ul className="flex justify-center items-center space-x-4">
    <li className="relative pr-4 after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
        <Link href="/muertos/" className="text-white hover:text-gray-300">
          Muertos
        </Link>
      </li>
    </ul>
  </nav>
);

  return (
    <main className="flex flex-col min-h-screen p-6">
      {renderNavigation()}
      {!isConnected ? (
        <div className="flex flex-col items-center">
          {renderWelcomeContent()}
          </div>
      ) : (
        <div className="flex flex-col items-center">
          {isHolder ? (
            <div className="flex flex-col items-center mt-4">
              {renderWelcomeContent()}
            </div>
          ) : loadStoryElements ? (
            storyElementToNftMap.size > 0 && (
              <div>
                <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
                  If you are not yet a World Builder holder, you can mint one here: <a href={WorldBuildingPassMintingPage} className="text-blue-500 underline">Mint your {WorldName} Founder Pass</a>.
                </p>
              </div>
            )
          ) : null}
        </div>
      )}
    </main>
  );

}
