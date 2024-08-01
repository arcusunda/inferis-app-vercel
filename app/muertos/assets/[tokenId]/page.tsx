'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BaseNFTMetadata } from '../../../../utils/utils';
import { NFT, StoryElement } from '../../../types';
import '@/app/globals.css';
import { useAccount } from 'wagmi';
import { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } from 'obscenity';
import { useRouter } from 'next/navigation';

const aspects = [
  "Magical Item",
  "Magical Creature",
  "Cryptic Clue",
  "Secret Society",
  "Character - Mortal Antagonist"
];

const fetchNFTDetails = async (tokenId: string): Promise<NFT | null> => {
  try {
    const response = await axios.get(`https://ipfs.io/ipfs/${BaseNFTMetadata}/${tokenId}.json`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    return null;
  }
};

const fetchStoryElementsByAspect = async (aspect: string): Promise<StoryElement[]> => {
  try {
    const response = await fetch(`/api/storyelements?isRoot=false&aspect=${encodeURIComponent(aspect)}`);
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching story elements:', error);
    return [];
  }
};

type DetailPageProps = {
  params: {
    tokenId: string;
  };
};

const NFTDetails = ({ params }: DetailPageProps) => {
  const { tokenId } = params;
  const router = useRouter();
  const [nft, setNft] = useState<NFT | null>(null);
  const [storyElements, setStoryElements] = useState<{ [aspect: string]: StoryElement[] }>({});
  const [selectedStoryElements, setSelectedStoryElements] = useState<{ [aspect: string]: number | null }>({});
  const [isOwner, setIsOwner] = useState(false);
  const [isNameChecked, setIsNameChecked] = useState(false);
  const { address } = useAccount();
  const [givenName, setGivenName] = useState('');
  const [nameCheckResult, setNameCheckResult] = useState<string | null>(null);
  const [savedCharacterName, setSavedCharacterName] = useState<string | null>(null);
  const [bodyStoryElement, setBodyStoryElement] = useState<StoryElement | null>(null);
  const [maskStoryElement, setMaskStoryElement] = useState<StoryElement | null>(null);
  const [headwearStoryElement, setHeadwearStoryElement] = useState<StoryElement | null>(null);
  const censor = new TextCensor();
  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

  const initialAspect = aspects.length > 0 ? aspects[0] : '';

  const [activeAspect, setActiveAspect] = useState<Aspect>(initialAspect);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return;
      try {
        const response = await fetch(`/api/alchemy/fetchmetadata?wallet=${address}`);
        if (response.ok) {
          const data = await response.json();
          setIsOwner(data.nfts.some((nft: { tokenId: string }) => nft.tokenId === tokenId));
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setIsOwner(false);
      }
    };

//    if (router.isReady) {
      const fetchData = async () => {
      if (tokenId) {
        fetchNFTs();

        const nftData = await fetchNFTDetails(tokenId);
        setNft(nftData);

        if (nftData) {
          const fetchElementsByAspects = async () => {
            try {
              const elements = await Promise.all(aspects.map(aspect => fetchStoryElementsByAspect(aspect)));
              const elementsMap: { [aspect: string]: StoryElement[] } = aspects.reduce((acc, aspect, index) => {
                acc[aspect] = elements[index];
                return acc;
              }, {} as { [aspect: string]: StoryElement[] });
              setStoryElements(elementsMap);
            } catch (error) {
              console.error('Error fetching story elements:', error);
            }
          };

          fetchElementsByAspects();

          try {
            const response = await fetch(`/api/characternames?tokenId=${tokenId}`);
            if (response.ok) {
              const result = await response.json();
              if (result) {
                setSavedCharacterName(`${result.givenName} ${result.surname}`);
                setGivenName(`${result.givenName}`);
              }
            }
          } catch (error) {
            console.error('Error fetching character names:', error);
          }
        }
      }
    };

      fetchData();
//    }
  }, [/*router.isReady, */tokenId, address]);

  useEffect(() => {
    const fetchStoryElements = async () => {
      if (!nft) return;

      const bodyAttribute = nft.attributes.find(attr => attr.trait_type === 'Body')?.value;
      const maskAttribute = nft.attributes.find(attr => attr.trait_type === 'Mask')?.value;
      const headwearAttribute = nft.attributes.find(attr => attr.trait_type === 'Headwear')?.value;

      try {
        const [bodyResponse, maskResponse, headwearResponse] = await Promise.all([
          fetch(`/api/storyelementsname/${encodeURI(bodyAttribute ?? 'Unknown name')}`),
          fetch(`/api/storyelementsname/${encodeURI(maskAttribute ?? 'Unknown name')}`),
          headwearAttribute ? fetch(`/api/storyelementsname/${encodeURI(headwearAttribute)}`) : Promise.resolve(null),
        ]);

        const bodyStoryElement = await bodyResponse.json();
        const maskStoryElement = await maskResponse.json();
        const headwearStoryElement = headwearResponse ? await headwearResponse.json() : null;

        setBodyStoryElement(bodyStoryElement);
        setMaskStoryElement(maskStoryElement);
        setHeadwearStoryElement(headwearStoryElement);
      } catch (error) {
        console.error('Error fetching specific story elements:', error);
      }
    };

    fetchStoryElements();
  }, [nft]);

  const handleSaveCharacter = async () => {
    if (!nft/* || !givenName.trim()*/) return;

    try {
      const combinedStoryElements = [
        ...Object.values(selectedStoryElements).filter(Boolean),
        bodyStoryElement?.id,
        maskStoryElement?.id,
        headwearStoryElement?.id
      ].filter(Boolean).join(', ');

      const character = {
        name: nft.name,
        description: "A character sheet for this Muerto.",
        image: nft.image,
        wallet: address,
        tokenId,
        givenName,
        created: new Date(),
        updated: new Date(),
              attributes: [
          {
            trait_type: "StoryElements",
            value: combinedStoryElements
          }
        ]
      };

      const response = await fetch(`/api/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(character),
      });

      if (response.ok) {
        // Navigate to the story ideas page after saving the character
        router.push(`/muertos/storyideas/${tokenId}`);
      } else {
        console.error('Failed to save character');
      }
    } catch (error) {
      console.error('Error saving character:', error);
    }
  };

  const handleGivenName = (name: string) => {
    const matches = matcher.getAllMatches(name);
    const censoredName = censor.applyTo(name, matches);
    setGivenName(censoredName);
    setSavedCharacterName(null);
    setNameCheckResult(null);
  };

  const handleCheckName = async () => {
    if (!givenName.trim() || !nft) return;

    try {
      const maskAttribute = nft.attributes.find(attr => attr.trait_type === 'Mask');
      const surname = maskAttribute ? maskAttribute.value : 'Unknown';

      const response = await fetch(`/api/characternames`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ givenName, surname, tokenId: parseInt(tokenId, 10) }),
      });

      const result = await response.json();

      if (response.ok) {
        setNameCheckResult('Name available. Save it!');
        setIsNameChecked(true);
      } else {
        setNameCheckResult(result.error || 'Error checking name');
        setIsNameChecked(false);
      }
    } catch (error) {
      console.error('Error checking name:', error);
      setNameCheckResult('Error checking name');
      setIsNameChecked(false);
    }
  };

  const handleStoryElementSelect = useCallback((aspect: string, elementId: number) => {
    setSelectedStoryElements(prev => ({
      ...prev,
      [aspect]: prev[aspect] === elementId ? null : elementId,
    }));
  }, []);

  const memoizedStoryElements = useMemo(() => storyElements, [storyElements]);
  const memoizedSelectedStoryElements = useMemo(() => selectedStoryElements, [selectedStoryElements]);

  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-center items-center space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/assets/" className="text-white hover:text-gray-300">
            Your Muertos
          </Link>
        </li>
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/storyideas/" className="text-white hover:text-gray-300">
            Story Ideas
          </Link>
        </li>
        <li>
          <w3m-button />
        </li>
      </ul>
    </nav>
  );

  type Aspect = string;
  
  interface StoryElementsSectionProps {
    aspects: Aspect[];
    storyElements: { [aspect: string]: StoryElement[] };
    selectedStoryElements: { [aspect: string]: number | null };
    handleStoryElementSelect: (aspect: Aspect, elementId: number) => void;
  }
  
  const StoryElementsSection: React.FC<StoryElementsSectionProps> = ({
    aspects,
    storyElements,
    selectedStoryElements,
    handleStoryElementSelect,
  }) => {
//    const [activeAspect, setActiveAspect] = useState<Aspect>(aspects.length > 0 ? aspects[0] : '');

    useEffect(() => {
      if (!aspects.includes(activeAspect)) {
        setActiveAspect(aspects[0]);
      }
    }, [aspects]);

    return (
      <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Select your Story Elements</h2>
            <div className="tabs">
          {aspects.map(aspect => (
            <button
              key={aspect}
              onClick={() => setActiveAspect(aspect)}
              className={`tab ${activeAspect === aspect ? 'active' : ''}`}
            >
              {aspect}
            </button>
          ))}
        </div>
        <div className="story-elements-grid">
          {storyElements[activeAspect]?.map((element) => (
            <div
              key={element.id}
              className={`card ${selectedStoryElements[activeAspect] === element.id ? 'selected' : ''}`}
              onClick={() => handleStoryElementSelect(activeAspect, element.id)}
            >
              <h3>{element.name}</h3>
              <p>{element.attributes?.find(attr => attr.trait_type === 'Text')?.value || 'No description available'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
     
  return (
    <main className="flex flex-col min-h-screen p-6">
      {renderNavigation()}

      {!address ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-500">Please connect your wallet</p>
        </div>
      ) : !nft || !isOwner ? (
        <div className="flex justify-center items-center h-full">
          <div>
            <p className="text-xl text-gray-500">Please choose from your list of Muertos.</p>
            <Link href="/muertos/assets/" className="text-white hover:text-gray-300">
              Your Muertos
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-full">
          <h2 className="text-lg font-bold mb-2">
            {savedCharacterName ? savedCharacterName : nft.name}
          </h2>
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-6 w-full">
            <img
              src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
              alt={`Token ID: ${tokenId}`}
              className="w-full lg:w-1/3 h-auto rounded-lg mb-4 lg:mb-0 p-4"
              style={{ borderRadius: '0.75rem' }}
            />
            <div className="text-sm text-gray-400 w-full lg:w-1/2">
              <p className="mb-2"><strong>Token ID:</strong> {tokenId}</p>
              {nft.attributes.map((attr, index) => (
                <p key={index} className="mb-1"><strong>{attr.trait_type}:</strong> {attr.value}</p>
              ))}
            </div>
            <div className="flex justify-center mt-4">
                <button
                  onClick={handleSaveCharacter}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                >
                  Save Character
                </button>
              </div>
            <div className="text-sm text-gray-400 w-full lg:w-1/2">
              <div className="mt-6">
                <StoryElementsSection
                  aspects={aspects}
                  storyElements={memoizedStoryElements}
                  selectedStoryElements={memoizedSelectedStoryElements}
                  handleStoryElementSelect={handleStoryElementSelect}
                />
              </div>
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSaveCharacter}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                >
                  Save Character
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default NFTDetails;
