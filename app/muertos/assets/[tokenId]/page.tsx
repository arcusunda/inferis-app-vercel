'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BaseNFTMetadata } from '../../../../utils/utils';
import { Character } from '../../../types';
import '@/app/globals.css';
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { useAccount } from "wagmi"
import { Talent, NFT } from '../../../types';
import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';
import { text } from 'stream/consumers';

const fetchNFTDetails = async (tokenId: string): Promise<NFT | null> => {
  try {
    console.info('tokenId:', tokenId);
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

const fetchTalents = async (tokenId: string): Promise<Talent[]> => {
  try {
    const response = await fetch(`/api/talents/${tokenId}`);
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching talents:', error);
    return [];
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

type DetailPageProps = {
  params: {
    tokenId: string;
  };
};

const NFTDetails = ({ params }: DetailPageProps) => {
  const { tokenId } = params;
  const [nft, setNft] = useState<NFT | null>(null);
  const [nfts, setNfts] = useState([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [voteStatus, setVoteStatus] = useState<{ [key: string]: boolean }>({});
  const [isOwner, setIsOwner] = useState(false);
  const { address } = useAccount();
  const [givenName, setGivenName] = useState('');
  const [nameCheckResult, setNameCheckResult] = useState<string | null>(null);
  const [savedCharacterName, setSavedCharacterName] = useState<string | null>(null);
  const [isCharacterSaved, setIsCharacterSaved] = useState(false);
  const [isNameChecked, setIsNameChecked] = useState(false);
  const censor = new TextCensor();
  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

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
          setNfts(data.nfts);
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
      fetchNFTs(address as string);

      const fetchData = async () => {
        const nftData = await fetchNFTDetails(tokenId as string);
        setNft(nftData);
        if (nftData) {

          const talentsData = await fetchTalents(tokenId as string);
          setTalents(talentsData);

          const characterData = await fetchCharacterByTokenId(tokenId);
          if (characterData) {
            const talentsMap: { [key: string]: Set<number> } = {
              maskTalents: new Set(),
              bodyTalents: new Set(),
              headwearTalents: new Set(),
              expressionTalents: new Set(),
            };

            characterData.attributes.forEach(attr => {
              if (attr.trait_type === "Talents") {
                attr.value.toString().split(', ').forEach(talentId => {
                  const talent = talentsData.find(a => a.id === parseInt(talentId, 10));
                  if (talent) {
                    const categoryKey = talent.categoryType.toLowerCase() + 'Talents';
                    if (!talentsMap[categoryKey]) {
                      talentsMap[categoryKey] = new Set();
                    }
                    talentsMap[categoryKey].add(talent.id);
                  }
                });
              }
            });
            
            setSelectedTalents(talentsMap);
            setIsCharacterSaved(true);
          }
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
      };
      fetchData();
    }
  }, [tokenId]);

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
      setIsCharacterSaved(true);
      setNameCheckResult(null);
      setIsNameChecked(false);
      const maskAttribute = nft.attributes.find((attr) => attr.trait_type === 'Mask');
      const surname = maskAttribute ? maskAttribute.value : 'Unknown';
      setSavedCharacterName(givenName + ' ' + surname);

    } else {
      console.error('Failed to save character');
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

  const handleGivenName = (givenName: string) => {
    const matches = matcher.getAllMatches(givenName);
    const censoredComment = censor.applyTo(givenName, matches);
    setGivenName(censoredComment);
    setSavedCharacterName(null);
    setNameCheckResult(null);
  }

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
            <div className="text-sm text-gray-400 w-full lg:w-1/2">
              <div className="mt-6">
                <h2 className="text-lg font-bold mb-2">Select 1 talent in each category. (Hover for description)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-500">
                    <thead>
                      <tr>
                        <th className="border border-gray-500 px-2 py-1">Select</th>
                        <th className="border border-gray-500 px-2 py-1">Talent Name</th>
                        <th className="border border-gray-500 px-2 py-1">Category</th>
                        <th className="border border-gray-500 px-2 py-1">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {talents.map((talent) => {
                        const traitTypeKey = categoryToTalentType(talent.categoryType);
                        return (
                          <tr key={talent._id} className="border border-gray-500">
                            <td className="border border-gray-500 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={selectedTalents[traitTypeKey]?.has(talent.id) || false}
                                onChange={() => handleTalentSelect(talent.categoryType, talent.id)}
                              />
                            </td>
                            <td className="border border-gray-500 px-2 py-1" title={talent.description}>
                              <strong>{talent.name}</strong>
                            </td>
                            <td className="border border-gray-500 px-2 py-1">{talent.categoryName}</td>
                            <td className="border border-gray-500 px-2 py-1">{capitalizeFirstLetter(talent.categoryType)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>  
              {isCharacterSaved && (
              <div className="mt-4">
                <label htmlFor="givenName" className="block mb-2 text-xs font-medium text-gray-300">
                  Given Name
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    id="givenName"
                    className="input-text"
                    value={givenName}
                    onChange={(e) => handleGivenName(e.target.value)}
                  />
                  <button
                    className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 text-xs"
                    onClick={isNameChecked ? handleSaveCharacter : handleCheckName}
                  >
                    {isNameChecked ? 'Save' : 'Check'}
                  </button>
                </div>
                {nameCheckResult && (
                  <p className="mt-2 text-xs text-white-500">{nameCheckResult}</p>
                )}
              </div>
            )}
              <div className="flex justify-center mt-4">
                {isCharacterSaved ? (
              <Link href={`/muertos/storyideas/${nft.tokenId}`} key={nft.tokenId} className="border border-gray-300 rounded-lg p-4 max-w-xs text-center">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                  Create Story Idea
                </button>
              </Link>

                ) : (
                  <button
                    onClick={handleSaveCharacter}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                  >
                    Save Character
                  </button>
                )}
              </div>
            </div>
          </div>  
          <div className="mt-8 w-full">
            <div className="overflow-x-auto">
            </div>
  
          </div>
        </div>
      )}
    </main>
  );
  
};

export default NFTDetails;
