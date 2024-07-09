'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/globals.css';
import { Quest } from '../../../app/types';

const QuestsList = () => {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    fetch(`/api/quests/`)
      .then(response => response.json())
      .then(data => setQuests(data));
    }, []);

  function convertIpfsUrl(ipfsUrl: string): string {
    if (ipfsUrl.startsWith('ipfs://')) {
        return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return ipfsUrl;
  }
        
  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-center items-center space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/assets/" className="text-white hover:text-gray-300">
            Your Muertos
          </Link>
        </li>
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/quests/" className="text-white hover:text-gray-300">
            Quests
          </Link>
        </li>
        <li>
          <w3m-button />
        </li>
      </ul>
    </nav>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6">
      {renderNavigation()}
      <h1>Quests List</h1>
      <div className="w-full">
        {quests.map((quest) => (
          <div key={quest.name} className="border rounded p-2 mb-4">
            <h3>{quest.name}</h3>
            {quest.image && (
              <div className="mb-4">
                <img src={convertIpfsUrl(quest.image)} alt={`${quest.name} Image`} className="w-1/4 h-auto rounded" />
              </div>
            )}
            <p>{quest.description}</p>
            <div>
              <strong>Level:</strong> {quest.attributes.find(attr => attr.trait_type === 'Level')?.value}
            </div>
            <div>
              <strong>Rewards:</strong> {quest.attributes.find(attr => attr.trait_type === 'Rewards')?.value}
            </div>
            <div>
              <strong>Prompt:</strong> {quest.attributes.find(attr => attr.trait_type === 'Prompt')?.value}
            </div>
            <div>
              <strong>XP:</strong> {quest.attributes.find(attr => attr.trait_type === 'XP')?.value}
            </div>
            <Link href={`/muertos/quests/${encodeURIComponent(quest.name)}`} className="text-blue-500 hover:underline mt-4 block">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
};

export default QuestsList;
