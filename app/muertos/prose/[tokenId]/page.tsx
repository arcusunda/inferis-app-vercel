'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BaseNFTMetadata } from '../../../../utils/utils';
import { StoryElement, Character, Talent, NFT, Prose, Chapter } from '../../../types';
import '@/app/globals.css';
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { useAccount } from "wagmi"

const fetchNFTDetails = async (tokenId: string): Promise<NFT | null> => {
  try {
    const response = await axios.get(`https://ipfs.io/ipfs/${BaseNFTMetadata}/${tokenId}.json`);

    if (response.data) {
      const data = await response.data;
      return data;
    } else {
      console.error('Error:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    return null;
  }
};

const fetchProseByTokenId = async (tokenId: string): Promise<Prose | null> => {
    try {
      const response = await fetch(`/api/prose/${tokenId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error('Failed to fetch prose:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching prose:', error);
      return null;
    }
  };
  
const fetchCharacterByTokenId = async (tokenId: string): Promise<Character | null> => {
  try {
    const response = await fetch(`/api/characters/${encodeURIComponent(tokenId)}`);
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Failed to fetch character:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
};

type ProseDetailsPageProps = {
  params: {
    tokenId: string;
  };
};

const ProseDetails = ({ params }: ProseDetailsPageProps) => {
  const { tokenId } = params;
  const [nft, setNft] = useState<NFT | null>(null);
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [aiText, setAiText] = useState<string>('');
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [voteStatus, setVoteStatus] = useState<{ [key: string]: boolean }>({});
  const [checkedElements, setCheckedElements] = useState<{ [key: number]: boolean }>({});
  const [isOwner, setIsOwner] = useState(false);
  const { address } = useAccount();
  const baseStat = 10;
  const [givenName, setGivenName] = useState('');
  const [nameCheckResult, setNameCheckResult] = useState<string | null>(null);
  const [savedCharacterName, setSavedCharacterName] = useState<string | null>(null);
  const [prose, setProse] = useState<Prose | null>(null);

  const [selectedTalents, setSelectedTalents] = useState<{ [key: string]: Set<number> }>({
    maskTalents: new Set(),
    bodyTalents: new Set(),
    headwearTalents: new Set(),
    expressionTalents: new Set(),
  });

  const fetchNFTs = async (address: string) => {
    try {
      const response = await fetch(`/api/alchemy/fetchmetadata?wallet=${address}`);
      const data = await response.json();
      if (response.ok) {
        if (data.nfts) {
          const nfts: NFT[] = data.nfts;
          const nftFound = nfts.find(nft => nft.tokenId === tokenId);
          if (!nftFound) {
            setNft(null);
            setIsOwner(false);
            return;
          }
          setNft(nftFound);
          setIsOwner(true);
        }
          return data.nfts;
      } else {
        setIsOwner(false);
        console.error('Error:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  };

  useEffect(() => {

    if (tokenId) {
//      fetchNFTs(address as string);

      const fetchData = async () => {
        const nftData = await fetchNFTDetails(tokenId as string);
        setNft(nftData);
        if (nftData) {

              
          const maskAttribute = nftData.attributes.find((attr) => attr.trait_type === 'Mask');
          const surname = maskAttribute ? maskAttribute.value : 'Unknown';

          const response = await fetch(`/api/characternames?tokenId=${tokenId}`);
          if (response.ok) {
            const result = await response.json();
            if (result) {
              setSavedCharacterName(`${result.givenName} ${result.surname}`);
              setGivenName(`${result.givenName}`);
            }
          }
        }
        const proseData = await fetchProseByTokenId(tokenId as string);
        setProse(proseData);
     };
      fetchData();
    }
  }, [tokenId]);

  const handlePromptClick = async () => {
    const selectedElements = storyElements.filter(el => checkedElements[el.id]);
    const elementIds = selectedElements.map(el => el.id).join(',');
    const maskAttribute = nft?.attributes.find((attr) => attr.trait_type === 'Mask');
    const surname = maskAttribute ? maskAttribute.value : 'Unknown';

    const characterName = givenName + ' ' + surname;

    const response = await fetch(`/api/rootprompts/Logline?promptName=Logline`);

    const loglineData = await response.json();

    const aiPrompt = 'The character name is: ' + characterName + '. ' + loglineData.promptText;

    const serializedTalents = Object.fromEntries(
      Object.entries(selectedTalents).map(([key, value]) => [key, Array.from(value)])
    );

    const aiResponse = await fetch(`/api/storyelements/associations/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText: aiPrompt, storyElementIds: elementIds, selectedTalents: serializedTalents }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      setAiText(aiData.aiText);
    }
  };

  const fetchTotalLikesCount = async (elementName: string) => {
    const voterAddress = address;
    const response = await fetch(`/api/storyelements/vote/check-vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storyElementName: elementName }),
    });
  
    const data = await response.json();
    return data.likes;
  };
  
  const checkVote = async (elementName: string) => {
    const voterAddress = address;

    const response = await fetch('/api/storyelements/vote/check-vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          voterAddress,
          tokenId,
          storyElementName: elementName,
        })
    });

    const data = await response.json();
    return data.likes;
  };

  const handleLikeClick = async (elementName: string) => {
    const voterAddress = address;
    const comment = comments[elementName] || '';
    const vote = 'Yes';

    const response = await fetch('/api/storyelements/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterAddress,
        tokenId,
        storyElementName: elementName,
        vote,
        comment,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setLikes((prevLikes) => ({
        ...prevLikes,
        [elementName]: data.likes,
      }));
      setVoteStatus((prevStatus) => ({
        ...prevStatus,
        [elementName]: true,
      }));
    }
  };

  const handleCommentChange = (elementName: string, value: string) => {
    setComments((prevComments) => ({
      ...prevComments,
      [elementName]: value,
    }));
  };

  const handleSaveCharacter = async () => {
    if (!nft) {
      console.error('NFT is null');
      return;
    }
  
    const character = {
      id: 1,
      name: nft.name,
      description: "A character sheet for this Muerto.",
      image: nft.image,
      wallet: address,
      tokenId: nft.tokenId,
      givenName: givenName,
      attributes: [
        {
          trait_type: "Talents",
          value: Array.from(selectedTalents.maskTalents)
            .concat(Array.from(selectedTalents.bodyTalents))
            .concat(Array.from(selectedTalents.headwearTalents))
            .concat(Array.from(selectedTalents.expressionTalents))
            .map(talentId => talents.find(talent => talent.id === talentId)?.id)
            .join(', ')
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
      const data = await response.json();
      setGivenName('');
      setNameCheckResult(null);
    } else {
      console.error('Failed to save character');
    }
  };
    
  const handleCheckboxChange = (elementId: number) => {
    setCheckedElements((prevChecked) => ({
      ...prevChecked,
      [elementId]: !prevChecked[elementId],
    }));
  };

  const handleSaveStoryIdea = async () => {
    const storyIdea = {
      text: aiText,
      tokenId: tokenId,
      image: nft?.image,
      state: 'Draft',
    };

    const response = await fetch('/api/storyideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyIdea),
    });

    if (response.ok) {
      const data = await response.json();
    } else {
      console.error('Failed to save story idea');
    }
  };

  const categoryToTalentType = (categoryType: string): string => {
    switch (categoryType) {
      case 'mask':
        return 'maskTalents';
      case 'body':
        return 'bodyTalents';
      case 'headwear':
        return 'headwearTalents';
      case 'expression':
        return 'expressionTalents';
      default:
        return '';
    }
  };
    
  const handleTalentSelect = (categoryType: string, talentId: number) => {
    const traitType = categoryToTalentType(categoryType);
    if (!traitType) return;
  
    setSelectedTalents((prevSelected) => {
      const newSelected = { ...prevSelected };
      const updatedSet = new Set(newSelected[traitType]);
  
      if (updatedSet.has(talentId)) {
        updatedSet.delete(talentId);
      } else {
        if (updatedSet.size < 1) {
          updatedSet.add(talentId);
        }
      }
  
      newSelected[traitType] = updatedSet;
      return newSelected;
    });
  };

  const handleCheckName = async () => {
    if (!givenName.trim()) {
      setNameCheckResult('Please enter a given name');
      return;
    }

    if(!nft) {
      return;
    }

    const maskAttribute = nft?.attributes.find((attr) => attr.trait_type === 'Mask');
    const surname = maskAttribute ? maskAttribute.value : 'Unknown';

    try {
      const response = await fetch(`/api/characternames`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ givenName, surname, tokenId: parseInt(tokenId, 10) }),
      });

      const result = await response.json();

      if (response.ok) {
        setNameCheckResult('Name available.');
      } else {
        setNameCheckResult(result.error || 'Error checking name');
      }
    } catch (error) {
      console.error('Error checking name:', error);
      setNameCheckResult('Error checking name');
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
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

  return (
    <main className="flex flex-col min-h-screen p-6">
      {renderNavigation()}
      
      {!address ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-500">Please connect your wallet</p>
        </div>
      ) : !nft ? (
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
          </div>  
          {prose && (
            <div className="prose-content mt-4">
              {prose.chapters.map((chapter: Chapter, index: number) => (
                <div key={index} className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{chapter.title}</h3>
                  <p className="text-gray-700">{chapter.prose}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default ProseDetails;
