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
      In the coastal town of Eldridge Hollow, a place where the supernatural and mundane coexist uneasily, seventeen-year-old Talisa Esperanza discovers she can see and communicate with spirits—muertos—trapped between worlds. Born into a family with a rich Mexican-American heritage and a lineage of psychic abilities, Talisa's gifts awaken fully after the mysterious deaths of her parents. These abilities, however, come with a heavy burden: the muertos appear to Talisa, drawn by her unique sensitivity, seeking resolution for their unfinished business. As Talisa navigates the complexities of high school life, she also embarks on a deeper journey into the spiritual and cultural fabric of Eldridge Hollow, a town built on an ancient convergence of ley lines that heighten supernatural activity. The town's diverse population, rich history, and eerie folklore create a tapestry of stories and secrets, some of which are tied to Talisa's own family. When Talisa encounters her first muerto—her great uncle—she realizes that these spirits are not merely passive remnants but active participants in a struggle for peace and resolution. Each muerto she meets has a story, a life interrupted by unresolved issues or unspoken truths. With the help of her friends, including the logical and resourceful Simon Langley and the supportive Connor Sullivan, Talisa takes on the role of a mediator, helping these spirits move on while uncovering the hidden truths of her town and family. However, Talisa's journey is fraught with danger. Malevolent entities, dark secrets, and the enigmatic <em>Guardians of the Veil</em>—a secret society aware of the town's mystical significance—pose constant threats. The stakes rise as Talisa delves deeper into her parents' mysterious deaths, which are hinted to be connected to the darker aspects of the spiritual world.
      </p>
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
      <em>Tali and the 10,000 Muertos</em> explores themes of cultural heritage, identity, and the fine line between life and death. Talisa's quest for understanding and justice not only brings peace to the restless spirits but also helps her come to terms with her own grief and the legacy of her family. The series blends the everyday challenges of teenage life with the extraordinary demands of navigating a world filled with the supernatural, promising a captivating journey of mystery, discovery, and emotional resonance.
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
