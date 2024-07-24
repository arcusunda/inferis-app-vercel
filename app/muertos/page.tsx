"use client";
import { useState, useEffect } from 'react';
import { BannerImageUrl, WorldName, WorldSummary } from '../../utils/utils';
import Link from 'next/link';
import { useAccount } from 'wagmi'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const account = useAccount();

  require('dotenv').config();
 
  const renderBanner = () => (
    <img
      src={BannerImageUrl}
      alt="Welcome"
      className="w-full h-64 object-cover mx-auto sm:h-96 md:h-128 lg:h-160 xl:h-192"
    />
  );

  const renderWelcomeContent = () => (
    <div className="text-center">
      {renderBanner()}
      <img
        src="los-muertos.png"
        alt="Los Muertos World holders"
        className="w-16 h-16 object-cover mx-auto sm:w-24 sm:h-24"
        style={{ paddingTop: '5px' }}
      />
      <h2 className="text-lg font-bold mt-4 sm:text-xl sm:mt-8">Holders of Los Muertos World</h2>
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-center text-sm sm:text-lg leading-5 sm:leading-7">
        (Coming soon)
      </p>
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
        Holders of Los Muertos World, your muerto may be a key to unlocking a collaborative storytelling adventure in the world of <em>Tali and the 10,000 Muertos</em>, an upcoming paranormal mystery series with elements of urban fantasy and magical realism, following a young protagonist as she navigates between the mortal world and a twilight realm, uncovering supernatural secrets while grappling with her own identity and family history. Your muerto could play a crucial role in Talisa's quest to unravel the mystery of Inferis and the forces keeping souls bound there. By selecting story elements associated with your muerto's attributes, you'll guide AI in generating a story idea that fits seamlessly into Talisa's story. Your creation could become the foundation for an episode where Talisa encounters your muerto and journeys with them to the twilight realm of Inferis, working to understand the reasons for their ensnarement and the connection to her own family mystery. Each story idea contributes to the rich tapestry of our shared universe, blending elements of cultural exploration, supernatural mystery, and personal discovery. A story idea potentially becomes a full episode, each one enriching our collective lore and may influence the unfolding narrative of Talisa's quest.
      </p>
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
        Once your story idea is generated, you may vote for others. The most captivating tales become part of the story's lore, celebrated as key episodes in an epic saga. Ready to see how your muerto might fit into this tale of two worlds? Step into Inferis, where every mask holds a story, and every story could be a clue to the greater mystery Talisa seeks to solve. Your muerto's journey - and perhaps the key to unlocking the secrets of Inferis - awaits.
      </p>
      <h2 className="text-lg font-bold mt-4 sm:text-xl sm:mt-8"> Tali and the 10,000 Muertos</h2>
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
      Since her 13th birthday, Talisa Esperanza has seen the world in ways no one else can. Born with the extraordinary gift—or burden—of seeing muertos, she encounters the souls trapped in Inferis, a twilight realm caught between the living world and Los Muertos World. These muertos manifest as tangible beings adorned with vibrant, multi-colored candy skull masks, displaying the manner of their death and accompanied by winged fairies or pulsating halos. Haunted by these striking, eerily present beings, Talisa's daily life is a delicate balance between her supernatural responsibilities and the normal challenges of being a teenager. Isolated from her peers and burdened by her unique sight, she’s driven by a deeper fear—the absence of her deceased parents during the Day of the Dead. Talisa dreads they might be trapped in Inferis rather than in Los Muertos World, and she is determined to uncover the truth.
      </p>
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
      Talisa embarks on a perilous journey to guide the muertos back to Los Muertos World, all while uncovering her own heritage and a larger spiritual conflict keeping these souls bound to Inferis. Her journey takes her through a shadowy mirror of her city, where familiar places twist into eerie versions, charged with spiritual power and crawling with dangerous magical creatures.
      </p>
    </div>
  );

  const renderNavigation = () => (
    <nav className="bg-gray-200 dark:bg-gray-800 p-2 sm:p-4">
      <ul className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400 dark:after:bg-gray-600">
          <Link href="/muertos" className="text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
            Home
          </Link>
        </li>
        {account && account.isConnected ? (
          <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400 dark:after:bg-gray-600">
            <Link href="/muertos/assets/" className="text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
              Your Muertos
            </Link>
          </li>
        ) : (
          <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400 dark:after:bg-gray-600">
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
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6">
      {renderNavigation()}
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
      {renderNavigation()}
      </main>
  );
}
