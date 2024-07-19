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
      <p className="mt-4 p-4 bg-gray-800 rounded text-left text-lg leading-7">
        Holders of Los Muertos World, your muerto may be a key to unlocking a collaborative storytelling adventure in the world of <em>Tali and the 10,000 Muertos</em>, an upcoming paranormal mystery series with elements of urban fantasy and magical realism, following a young protagonist as she navigates between the mortal world and a twilight realm, uncovering supernatural secrets while grappling with her own identity and family history. Your muerto could play a crucial role in Talisa's quest to unravel the mystery of Inferis and the forces keeping souls bound there. By selecting story elements associated with your muerto's attributes, you'll guide AI in generating a story idea that fits seamlessly into Talisa's story. Your creation could become the foundation for an episode where Talisa encounters your muerto and journeys with them to the twilight realm of Inferis, working to understand the reasons for their ensnarement and the connection to her own family mystery. Each story idea contributes to the rich tapestry of our shared universe, blending elements of cultural exploration, supernatural mystery, and personal discovery. A story idea potentially becomes a full episode, each one enriching our collective lore and may influence the unfolding narrative of Talisa's quest.
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-left text-lg leading-7">
        Talisa Esperanza has the unique gift or burden if you will, of seeing muertos outside the yearly Day of the Dead celebration. Particularly, those souls trapped in Inferis, a twilight realm caught between the world of the living and Los Muertos World. Since her 13th birthday, these souls have manifested to her as tangible beings dominated by their vibrant, multi-colored candy skull masks. Their bodies appear almost real, displaying the manner of their death, while some are adorned with flitting fairies or pulsating halos that sing like glass harps. These striking, eerily present beings haunt Talisa's daily life, isolating her from peers and precluding a normal life. Despite the weight of her gift and the frustration of not fully understanding it, Talisa is driven by a deeper fear - the absence of her deceased parents during the Day of the Dead and an almost unconscious desire to uncover why, dreading they might be trapped in Inferis rather than Los Muertos World. She hopes to guide the muertos back to Los Muertos World, all while uncovering the truth about her own heritage and a larger spiritual conflict that seems to be keeping these souls bound to Inferis. Through this journey, Talisa aims to bridge the gap between worlds, fostering understanding across cultures and realms of existence.
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-left text-lg leading-7">
        Once your story idea is generated, you may vote for others. The most captivating tales become part of the story's lore, celebrated as key episodes in an epic saga.
      </p>
      <p className="mt-4 p-4 bg-gray-800 rounded text-left text-lg leading-7">
        Ready to see how your muerto might fit into this tale of two worlds? Step into Inferis, where every mask holds a story, and every story could be a clue to the greater mystery Talisa seeks to solve. Your muerto's journey - and perhaps the key to unlocking the secrets of Inferis - awaits.
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
