'use client';

import Link from 'next/link';
import '@/app/globals.css';
import { useEffect, useState } from 'react';
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { useAccount } from "wagmi"
import ClipLoader from "react-spinners/ClipLoader";

interface Attribute {
  trait_type: string;
  value: string;
}

interface StoryElement {
  id: number;
  name: string;
  description: string;
  image: string;
  wbpImage: string;
  aspect: string;
  isRoot: boolean;
  attributes?: Attribute[];
  state: string;
  ipId?: `0x${string}`;
  licenseTermsId?: string;
  derivativeRegistration?: string;
  isRegistered?: boolean;
  childrenData?: any[];
  licenseTokenId?: string;
  dateCanonized?: Date;
  dateRegistered?: Date;
  isTokenized?: boolean;
  author: string;
  isSubmitted: boolean;
  created: Date;
  updated?: Date;
}

const StoryElementsPage = () => {
  const { open } = useWeb3Modal();
  const { address } = useAccount();
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStoryElements();
    const savedStoryElements = localStorage.getItem('storyElements');

    if (savedStoryElements) {
      setStoryElements(JSON.parse(savedStoryElements));
      localStorage.setItem('storyElements', JSON.stringify(storyElements));
    }
    setLoading(false);
  }, []);

  const fetchStoryElements = async () => {
    try {
      const response = await fetch('/api/storyelements');
      const data: StoryElement[] = await response.json();
      console.info('fetchedStoryElements:', data);
      if (response.ok) {
        setStoryElements(data);
        return data;
      } else {
        console.error('Error:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching StoryElements:', error);
      return [];
    }
  };

  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-center items-center space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/" className="text-white hover:text-gray-300">
            Home
          </Link>
        </li>
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/storyideas" className="text-white hover:text-gray-300">
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
        <p className="mt-4">Loading your Story Elements...</p>
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
      ) : !storyElements || storyElements.length < 1 ? (
        <>
          <div className="flex flex-wrap justify-center gap-6">
            <p className="text-xl text-gray-500">No Story Elements found</p>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {storyElements.map((element) => (
            <Link href={`/muertos/storyelements/${element.name}`} key={element.id} className="border border-gray-300 rounded-lg p-4 max-w-xs text-center">
              <img
                src={element.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                alt={`ID: ${element.id}`}
                className="w-40 h-auto rounded mb-4"
              />
              <div className="text-sm text-gray-400">
                <p><strong>Name:</strong> {element.name}</p>
                <p><strong>Description:</strong> {element.description}</p>
                {element.attributes && (
                  <div className="text-left">
                    {element.attributes.map((attr, idx) => (
                      <p key={idx}><strong>{attr.trait_type}:</strong> {attr.value}</p>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};

export default StoryElementsPage;
