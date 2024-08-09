"use client";
import { useState, useEffect } from 'react';
import { BannerImageUrl } from '../../utils/utils';
import Link from 'next/link';
import { useAccount } from 'wagmi'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [bodyCount, setBodyCount] = useState<number | null>(null);
  const [maskCount, setMaskCount] = useState<number | null>(null);
  const [headwearCount, setHeadwearCount] = useState<number | null>(null);
  const [expressionCount, setExpressionCount] = useState<number | null>(null);
  const account = useAccount();

  require('dotenv').config();
 
  const renderBanner = () => (
    <img
      src={BannerImageUrl}
      alt="Welcome"
      className="w-full h-64 object-cover mx-auto sm:h-96 md:h-128 lg:h-160 xl:h-192"
    />
  );
  
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const bodyCount = await getStoryElementCount('Muerto Body');
        const maskCount = await getStoryElementCount('Muerto Mask');
        const headwearCount = await getStoryElementCount('Muerto Headwear');
        const expressionCount = await getStoryElementCount('Muerto Expression');
        
        setBodyCount(bodyCount);
        setMaskCount(maskCount);
        setHeadwearCount(headwearCount);
        setExpressionCount(expressionCount);
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    };

    fetchCounts();
  }, []);

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
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
      Holders of Los Muertos World, your muerto could be key to unlocking a collaborative storytelling experience in the world of <em>Tali and the 10,000 Muertos</em>, an upcoming supernatural mystery series with elements of urban fantasy and magical realism, following a young protagonist as she navigates between the mortal world and a twilight realm, uncovering supernatural secrets while grappling with her own identity and family history. Your story element could play a part in Talisa's quest to unravel the mystery of Inferis and the forces keeping souls bound there. Story elements contribute to the rich tapestry of the universe of <em>Tali and the 10,000 Muertos</em>, each one enriching our collective lore, blending aspects of cultural exploration, supernatural mystery, and personal discovery. Your story element may influence the unfolding narrative of the series and could potentially become part of a full episode.
      </p>
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
        Disclaimer: This implementation of StoryElement is still in Beta testing for the series <em>Tali and the 10,000 Muertos</em>. Please be patient as we work to improve the experience and expand the features available to you. We appreciate your feedback and suggestions as we continue to develop this exciting new way to engage with the community. Story elements are subject to change and could potentially be reset.
      </p>
      <h2 className="text-lg font-bold mt-4 sm:text-xl sm:mt-8"         style={{ paddingTop: '10px' }}
      > Tali and the 10,000 Muertos</h2>
      <div className="flex justify-center space-x-2 mt-2">
    <div className="flex flex-col items-center">
      <img
        src="connor-sullivan.png"
        alt="Connor"
        className="w-200 h-200 object-cover"
        style={{ paddingTop: '1px' }}
      />
      <span className="mt-2 text-center text-xs sm:text-sm">Connor</span>
    </div>
    <div className="flex flex-col items-center">
      <img
        src="talisa-200.png"
        alt="Talisa"
        className="w-200 h-200 object-cover"
        style={{ paddingTop: '1px' }}
      />
      <span className="mt-2 text-center text-xs sm:text-sm">Talisa</span>
    </div>
    <div className="flex flex-col items-center">
      <img
        src="simon-langley.png"
        alt="Simon"
        className="w-200 h-200 object-cover"
        style={{ paddingTop: '1px' }}
      />
      <span className="mt-2 text-center text-xs sm:text-sm">Simon</span>
    </div>
  </div>
      <img
        src="muertos-season-one-1600.png"
        alt="Talisa"
        className="w-1600 h-160 object-cover mx-auto sm:w-1600 sm:h-160"
        style={{ paddingTop: '5px' }}
      />
      <p className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm sm:text-lg leading-5 sm:leading-7">
      In the coastal town of Eldridge Hollow, where the supernatural and mundane coexist uneasily, Talisa Esperanza is born (on The Day of the Dead) into a family with a rich Mexican-American heritage and a lineage of psychic abilities. Talisa's gifts awaken fully on her seventeen birthday, the day she discovers that she can see and communicate with spirits—muertos—trapped between worlds. However, these abilities come with a heavy burden: the muertos are drawn to Talisa, seeking her help to escape a sinister fate. The evil sorcerer Valtor trapped these spirits by dredging up their most shameful secrets and deepest regrets, using these nightmarish memories to force them into creating their own emotional and psychic prisons. These prisons manifest physically in the dark realm of Inferis, where the muertos are condemned to endlessly relive their worst fears. Valtor feeds on the potent emotions generated within these prisons, gaining strength from their suffering. Talisa's unique sensitivity allows her to establish a psychic connection with the trapped spirits. Through this connection, the muertos project a semblance of themselves, a totem, which provides Talisa with clues about their unresolved issues. With this information, she can research and uncover what they need to break free from their emotional bonds. Moreover, Talisa has the rare ability to journey into Inferis through a portal created by the muerto's totem, where she confronts the private hells of these spirits, helping them resolve their pain and escape Valtor's grip. As Talisa navigates the complexities of high school life, a life after the mysterious deaths of her parents, she also delves into the spiritual and cultural fabric of Eldridge Hollow, a town built on an ancient convergence of ley lines that amplify supernatural activity. The town's diverse population, rich history, and eerie folklore create a tapestry of stories and secrets, many of which are tied to Talisa's own family. With the help of her friends, including the logical and resourceful Simon Langley and the protective Connor Sullivan, Talisa takes on the role of a mediator, helping the muertos find peace and move on to Los Muertos World. However, Talisa's journey is fraught with danger. Malevolent entities, dark secrets, and the enigmatic Guardians of the Veil—a secret society aware of the town's mystical significance—pose constant threats. As Talisa delves deeper into her parents' mysterious deaths, she uncovers connections to the darker aspects of the spiritual world, raising the stakes in her quest to protect her loved ones and bring peace to the trapped souls.
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
            <Link href="/muertos/storyelements/create/" className="text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
              Story Elements
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

  async function getStoryElementCount(aspect: 'Muerto Body' | 'Muerto Mask' | 'Muerto Headwear' | 'Muerto Expression'): Promise<number> {
    const validAspects = ['Muerto Body', 'Muerto Mask', 'Muerto Headwear', 'Muerto Expression'];
  
    if (!validAspects.includes(aspect)) {
      throw new Error('Invalid aspect value');
    }
  
    const encodedAspect = encodeURIComponent(aspect);
    const response = await fetch(`/api/storyelements/catalog/${encodedAspect}`);
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch story element count');
    }
  
    const data = await response.json();
    return data.count;
  }
  
  const renderProgressTable = () => {
  
    const bodyTotal = 368;
    const maskTotal = 148;
    const headwearTotal = 32;
    const expressionTotal = 25;
  
    const calculatePercentage = (current: number, total: number) => ((current / total) * 100).toFixed(1) + '%';
  
    if (bodyCount === null || maskCount === null || headwearCount === null || expressionCount === null) {
      return <div>Loading...</div>;
    }
  
    return (
      <div className="overflow-x-auto mt-6 gap-6">
        <div className="flex flex-col items-center">Los Muertos World Collection</div>
        <div className="flex flex-col items-center">AI Catalog progress:</div>
        <table className="min-w-full bg-gray-200 dark:bg-gray-800 text-center rounded-lg border border-gray-400 mb-4">
          <thead>
            <tr>
              <th className="p-2 border border-gray-400">Mask</th>
              <th className="p-2 border border-gray-400">Body</th>
              <th className="p-2 border border-gray-400">Headwear</th>
              <th className="p-2 border border-gray-400">Expression</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-400">{calculatePercentage(maskCount, maskTotal)}</td>
              <td className="p-2 border border-gray-400">{calculatePercentage(bodyCount, bodyTotal)}</td>
              <td className="p-2 border border-gray-400">{calculatePercentage(headwearCount, headwearTotal)}</td>
              <td className="p-2 border border-gray-400">{calculatePercentage(expressionCount, expressionTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
     
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6">
      {renderNavigation()}
      {renderProgressTable()}
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
