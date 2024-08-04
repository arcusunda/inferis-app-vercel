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
  attributes?: Attribute[];
  state: string;
  isRoot: boolean;
}

const StoryElementsPage = () => {
  const { open } = useWeb3Modal();
  const { address } = useAccount();
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [aspectFilter, setAspectFilter] = useState<string>('All');

  useEffect(() => {
    fetchStoryElements();
  }, []);

  const fetchStoryElements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/storyelements');
      const data: StoryElement[] = await response.json();
      if (response.ok) {
        setStoryElements(data);
        localStorage.setItem('storyElements', JSON.stringify(data));
      } else {
        console.error('Error:', data);
      }
    } catch (error) {
      console.error('Error fetching StoryElements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAspectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAspectFilter(e.target.value);
  };

  const filteredElements = storyElements.filter((element) =>
    aspectFilter === 'All' || 
    element.attributes?.some(attr => attr.trait_type === 'Aspect' && attr.value === aspectFilter)
  );

  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-center items-center space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/assets/" className="text-white hover:text-gray-300">
            Your Muertos
          </Link>
        </li>
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
        <p className="mt-4">Loading Story Elements...</p>
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
    <main className="flex min-h-screen flex-col items-center justify-between p-6">
    {renderNavigation()}
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-center text-sm sm:text-lg leading-5 sm:leading-7">
      Foundational story elements already made into canon for the fictional series <em>Tali and the 10,000 Muertos</em>.
      </p>
      <div className="flex justify-center mb-6">
        <label htmlFor="aspect-filter" className="mr-4 text-lg">
          Filter by Aspect:
        </label>
        <select
          id="aspect-filter"
          value={aspectFilter}
          onChange={handleAspectChange}
          className="bg-gray-700 text-white rounded px-4 py-2"
        >
          <option value="All">All</option>
          <option value="Magical Item">Magical Item</option>
          <option value="Magical Creature">Magical Creature</option>
          <option value="Magic System">Magic System</option>
          <option value="Character">Character</option>
          <option value="Secret Society">Secret Society</option>
          <option value="Cryptic Clue">Cryptic Clue</option>
          <option value="Setting">Setting</option>
          <option value="Character - Mortal Antagonist">Mortal Antagonist</option>
          <option value="Muerto Mask">Mask</option>
          <option value="Muerto Body">Body</option>
          <option value="Muerto Headwear">Headwear</option>
        </select>
      </div>
      {!address ? (
        <div className="flex flex-wrap justify-center gap-6">
          <p className="text-xl text-gray-500">Please connect your wallet</p>
        </div>
      ) : !filteredElements || filteredElements.length < 1 ? (
        <div className="flex flex-wrap justify-center gap-6">
          <p className="text-xl text-gray-500">No Story Elements found</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {filteredElements.map((element) => (
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
