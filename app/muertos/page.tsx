"use client";
import { useState } from 'react';
import { BannerImageUrl, WorldName, WorldSummary } from '../../utils/utils';
import Link from 'next/link';
import { useAccount } from 'wagmi'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const account = useAccount()

  require('dotenv').config();
 
  const renderBanner = () => (
    <img
      src={BannerImageUrl}
      alt="Welcome"
      className="w-1600 h-500 object-cover mx-auto"
    />
  );

  const renderWelcomeContent = () => (
    <div className="text-center">
      {renderBanner()}
      <img
        src="los-muertos.png"
        alt="Los Muertos World holders"
        className="w-24 h-24 object-cover mx-auto"
        style={{ paddingTop: '5px' }}
      />
      <h2 className="text-xl font-bold mt-8">Holders of Los Muertos World</h2>
      <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
      (Coming soon)
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
      You are invited to step into a world where mystery and magic intertwine. The Inferis universe awaits your exploration, a realm shaped by the unique traits of Los Muertos World. As a holder of a muerto, you contribute to an evolving narrative that blends the macabre charm of Los Muertos World with the enigmatic depths of Inferis.
      </p>
      <h2 className="text-xl font-bold mt-4">Welcome to the World of {WorldName}</h2>
      <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
      Inferis is a place of endless possibilities and hidden secrets. It is a realm where the boundaries of reality are fluid, and every corner holds a story waiting to be told. Ancient forests whisper forgotten secrets, deserts shimmer with illusions, and cities pulse with the life of countless tales. This is a world where creativity is the most potent force. Inferis is not just a place; it is a living, breathing entity, shaped by those who dare to dream and explore. Each region within Inferis is unique, filled with challenges and wonders that reflect the diversity of its inhabitants.
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
      During the annual Day of the Dead festivities, an unexpected phenomenon occurs. A shimmering portal, pulsing with unknown energies, appears beside the traditional marigold bridge that connects the muertos to their living relatives. Drawn by curiosity and a desire for adventure, one muerto spies the subtle portal and ventures through this mysterious gateway to discover Inferis. In the coming days, more portals appear and other muertos pass through.
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
      Every Muerto holder has the opportunity to be part of the story. By selecting key Story Elements, you will prompt AI to generate a unique story idea that fits within the Inferis universe. This collaborative storytelling will not only expand the rich lore of Inferis but also highlight the diverse traits within Los Muertos World. Each story idea will be a piece of a grand mosaic, contributing to the ever-evolving tapestry of Inferis.
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
      Once your story idea is generated, you may vote for others. The most captivating tales become part of the Inferis lore, celebrated as key episodes in an epic saga. Your participation will help shape the destiny of Inferis, ensuring that every Muerto's part is unique and unforgettable.
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-center text-lg leading-7">
      Be ready to dive into the mysteries of Inferis. The adventure is about to begin, and your Muerto is the key to unlocking the magic and wonder that lies within. Join us in creating a world where every story matters, and every choice leads to new discoveries.
      </p>
    </div>
  );

  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-center items-center space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos" className="text-white hover:text-gray-300">
            Home
          </Link>
        </li>
        {account && account.isConnected ? (
          <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
            <Link href="/muertos/assets/" className="text-white hover:text-gray-300">
              Your Muertos
            </Link>
          </li>
        ) : (
          <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
              Your Muertos
          </li>
        )}
        <li>
          <w3m-button />
        </li>
      </ul>
    </nav>
  );
  
  return (
    <main className="flex min-h-screen flex-col items-left justify-between p-6">
      {!isConnected ? (
        <div className="flex flex-col items-center">
          {renderWelcomeContent()}
          </div>
      ) : (
        <div className="flex flex-col items-center">
        <div className="flex flex-col items-center mt-4">
          {renderWelcomeContent()}
        </div>
        </div>
      )}
    </main>
  );

}
