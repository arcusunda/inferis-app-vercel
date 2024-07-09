'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/globals.css';

type Quest = {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
};

type QuestPageProps = {
  params: {
    questName: string;
  };
};

const QuestDetail = ({ params }: QuestPageProps) => {
  const [quest, setQuest] = useState<Quest | null>(null);
  const { questName } = params;
  console.info('questName:', questName);

  useEffect(() => {
    if (questName) {
      const questNameStr = Array.isArray(questName) ? questName[0] : questName;
      fetch(`/api/quests/${questNameStr}`)
        .then(response => response.json())
        .then(data => setQuest(data));
    }
  }, [questName]);

  if (!quest) {
    return <div>Loading...</div>;
  }

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
        <li>
          <Link href="/muertos/quests/" className="text-white hover:text-gray-300">
            All Quests
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
      <h1>{quest.name}</h1>
      {quest.image && (
          <div className="mb-4">
                <img src={convertIpfsUrl(quest.image)} alt={`${quest.name} Image`} className="w-1/2 h-auto rounded" />
          </div>
        )}
      <div className="border rounded p-2">
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
        <Link href="/muertos/quests/" className="text-blue-500 hover:underline mt-4 block">
          Back to Quests
        </Link>
      </div>
    </main>
  );
};

export default QuestDetail;
