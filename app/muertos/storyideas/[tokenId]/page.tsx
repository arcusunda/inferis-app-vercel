'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BaseNFTMetadata } from '../../../../utils/utils';
import { StoryElement, Character, Talent, NFT } from '../../../types';
import '@/app/globals.css';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

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

const fetchStoryElements = async (attributes: { trait_type: string; value: string }[]): Promise<StoryElement[]> => {
  try {
    console.info('attributes:', attributes);
    const storyElements = await Promise.all(
      attributes.map(async (attr) => {
        const response = await fetch(`/api/storyelements/associations/${encodeURI(attr.value)}`);
        console.info('response:', response);
        if (response.ok) {
          const data = await response.json();
          console.info('associations data:', data);
          return Array.isArray(data) ? data : [];
        }
        return [];
      })
    );

    return storyElements.flat();
  } catch (error) {
    console.error('Error fetching story elements:', error);
    return [];
  }
};

const fetchRootStoryElements = async (): Promise<StoryElement[]> => {
  try {
    const response = await fetch('/api/storyelements?isRoot=true');

    if (response.ok) {
      const data = await response.json();
      console.info('Fetched story elements:', data);
      return Array.isArray(data) ? data : [];
    } else {
      console.error('Failed to fetch story elements:', response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error fetching story elements:', error);
    return [];
  }
};

const fetchTropes = async (tokenId: string): Promise<StoryElement[]> => {
  try {
    const response = await fetch(`/api/tropes/${tokenId}`);
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

type StoryIdeaDetailsPageProps = {
  params: {
    tokenId: string;
  };
};

const StoryIdeaDetails = ({ params }: StoryIdeaDetailsPageProps) => {
  const { tokenId } = params;
  const [nft, setNft] = useState<NFT | null>(null);
  const [nfts, setNfts] = useState([]);
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [tropes, setTropes] = useState<StoryElement[]>([]);
  const [aiText, setAiText] = useState<string>('');
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [voteStatus, setVoteStatus] = useState<{ [key: string]: boolean }>({});
  const [checkedElements, setCheckedElements] = useState<{ [key: number]: boolean }>({});
  const [isOwner, setIsOwner] = useState(false);
  const [isStoryIdeaLoaded, setIsStoryIdeaLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { address } = useAccount();
  const baseStat = 10;
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

  const [selectedTropes, setSelectedTropes] = useState<{ [key: string]: Set<number> }>({
    maskTalents: new Set(),
    bodyTalents: new Set(),
    headwearTalents: new Set(),
    expressionTalents: new Set(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAiPromptCompleted, setIsAiPromptCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchNFTs = async (address: string) => {
    try {
      const response = await fetch(`/api/alchemy/fetchmetadata?wallet=${address}`);
      const data = await response.json();
      if (response.ok) {
        if (data.nfts) {
          setNfts(data.nfts);
          const nfts: NFT[] = data.nfts;
          const nftFound = nfts.find((nft) => nft.tokenId === tokenId);
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
          const storyElementsData = await fetchStoryElements(nftData.attributes);
          const rootStoryElementsData = await fetchRootStoryElements();

          const elementMap = new Map<number, StoryElement>();
          [...storyElementsData, ...rootStoryElementsData].forEach((element) => {
            elementMap.set(element.id, element);
          });

          const combinedStoryElementsData = Array.from(elementMap.values());
          setStoryElements(combinedStoryElementsData);

          const initialCheckedElements: { [key: number]: boolean } = combinedStoryElementsData.reduce(
            (acc, element) => {
              if (element.isRoot) {
                acc[element.id] = true;
              }
              return acc;
            },
            {} as { [key: number]: boolean }
          );

          setCheckedElements(initialCheckedElements);

          const voteStatusData = await Promise.all(
            storyElementsData.map(async (element) => {
              const voteCount = await checkVote(element.name);
              return { [element.name]: voteCount > 0 };
            })
          );

          setVoteStatus(Object.assign({}, ...voteStatusData));
          const likesData = await Promise.all(
            storyElementsData.map(async (element) => {
              const likes = await fetchTotalLikesCount(element.name);
              return { [element.name]: likes };
            })
          );

          setLikes(Object.assign({}, ...likesData));

          const tropesData = await fetchTropes(tokenId as string);
          setTropes(tropesData);

          console.info(`tokenId: ${tokenId}`);
          const characterData = await fetchCharacterByTokenId(tokenId);

          if (characterData) {
            const tropeMap: { [key: string]: Set<number> } = {
              magicItems: new Set(),
              magicCreatures: new Set(),
              settings: new Set(),
              mortalAntagonists: new Set(),
              crypticClue: new Set()
            };

            characterData.attributes.forEach((attr) => {
              if (attr.trait_type === 'StoryElements') {
                attr.value
                  .toString()
                  .split(', ')
                  .forEach((tropeId) => {
                    const trope = tropesData.find((a) => a.id === parseInt(tropeId, 10));
                    if (trope) {
                      const categoryKey = trope.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect')?.value || 'No text available'.toLowerCase();
                      if (!tropeMap[categoryKey]) {
                        tropeMap[categoryKey] = new Set();
                      }
                      tropeMap[categoryKey].add(trope.id);
                    }
                  });
              }
            });

            setSelectedTropes(tropeMap);
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

          // Check if a StoryIdea exists
          const storyIdeaResponse = await fetch(`/api/storyideas/${tokenId}`);
          if (storyIdeaResponse.ok) {
            const storyIdeaResult = await storyIdeaResponse.json();
            if (storyIdeaResult) {
              console.info('Story Idea:', storyIdeaResult);
              setAiText(`${storyIdeaResult.text}`);
              setIsStoryIdeaLoaded(true);
              setIsAiPromptCompleted(true);
            }
          }
        }
      };
      fetchData();
    }
  }, [tokenId]);

  const handlePromptClick = async () => {
    setIsLoading(true);
    setIsAiPromptCompleted(false);
    const elementIds = tropes.map((el) => el.id).join(',');

    const response = await fetch(`/api/rootprompts/Logline?promptName=Logline`);

    const loglineData = await response.json();

    const aiPrompt = loglineData.promptText;

    const serializedTalents = Object.fromEntries(
      Object.entries(selectedTropes).map(([key, value]) => [key, Array.from(value)])
    );

    console.info('serializedTalents:', serializedTalents);
    const aiResponse = await fetch(`/api/storyelements/associations/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText: aiPrompt, storyElementIds: elementIds, selectedTalents: serializedTalents }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      setAiText(aiData.aiText);
      setIsAiPromptCompleted(true);
    }
    setIsLoading(false);
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voterAddress,
        tokenId,
        storyElementName: elementName,
      }),
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
      description: 'A character sheet for this Muerto.',
      image: nft.image,
      wallet: address,
      tokenId: nft.tokenId,
      givenName: givenName,
      attributes: [
        {
          trait_type: 'StoryElements',
          value: Array.from(selectedTropes.magicItems)
            .concat(Array.from(selectedTropes.magicCreatures))
            .concat(Array.from(selectedTropes.settings))
            .concat(Array.from(selectedTropes.mortalAntagonists))
            .concat(Array.from(selectedTropes.crypticClue))
            .map((tropeId) => tropes.find((trope) => trope.id === tropeId)?.id)
            .join(', '),
        },
      ],
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
      setGivenName('');
      setNameCheckResult(null);
      setIsNameChecked(false);
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
    setIsSaving(true);
    const storyIdea = {
      text: aiText,
      tokenId: tokenId as string,
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
      setIsStoryIdeaLoaded(true);
      setIsEditing(false);
    } else {
      console.error('Failed to save story idea');
    }
    setIsSaving(false);
  };

  const categoryToTropeType = (categoryType: string): string => {
    switch (categoryType) {
      case 'magicItem':
        return 'magicItems';
      case 'magicCreature':
        return 'magicCreatures';
      case 'mortalAntagonist':
        return 'mortalAntagonists';
      case 'setting':
        return 'settings';
      case 'crypticClue':
        return 'crypticClues';
      default:
        return '';
    }
  };

  const handleTropeSelect = (categoryType: string, tropeId: number) => {
    const traitType = categoryToTropeType(categoryType);
    if (!traitType) return;

    setSelectedTropes((prevSelected) => {
      const newSelected = { ...prevSelected };
      const updatedSet = new Set(newSelected[traitType]);

      if (updatedSet.has(tropeId)) {
        updatedSet.delete(tropeId);
      } else {
        if (updatedSet.size < 1) {
          updatedSet.add(tropeId);
        }
      }

      newSelected[traitType] = updatedSet;
      return newSelected;
    });
  };

  const handleAiText = (theAiText: string) => {
    const matches = matcher.getAllMatches(theAiText);
    const censoredAiText = censor.applyTo(theAiText, matches);
    setAiText(censoredAiText);
  };

  const handleGivenName = (givenName: string) => {
    const matches = matcher.getAllMatches(givenName);
    const censoredComment = censor.applyTo(givenName, matches);
    setGivenName(censoredComment);
    setSavedCharacterName(null);
    setNameCheckResult(null);
  };

  const handleCheckName = async () => {
    if (!givenName.trim()) {
      setNameCheckResult('Please enter a given name');
      return;
    }

    if (!nft) {
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
          <h2 className="text-lg font-bold mb-2">{savedCharacterName ? savedCharacterName : nft.name}</h2>
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-6 w-full">
            <img
              src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
              alt={`Token ID: ${tokenId}`}
              className="w-full lg:w-1/3 h-auto rounded-lg mb-4 lg:mb-0 p-4"
              style={{ borderRadius: '0.75rem' }}
            />
            <div className="text-sm text-gray-400 w-full lg:w-1/2">
              <p className="mb-2">
                <strong>Token ID:</strong> {tokenId}
              </p>
              {nft.attributes.map((attr, index) => (
                <p key={index} className="mb-1">
                  <strong>{attr.trait_type}:</strong> {attr.value}
                </p>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-500">
              <thead>
                <tr>
                  <th className="border border-gray-500 px-2 py-1">Trope Name</th>
                  <th className="border border-gray-500 px-2 py-1">Category</th>
                  <th className="border border-gray-500 px-2 py-1">Source</th>
                </tr>
              </thead>
              <tbody>
                {tropes
                  .filter((trope) => selectedTropes[categoryToTropeType(trope.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect')?.value || 'No text available')]?.has(trope.id))
                  .map((trope) => {
                    const traitTypeKey = categoryToTropeType(trope.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect')?.value || 'No text available');
                    return (
                      <tr key={trope.id} className="border border-gray-500">
                        <td className="border border-gray-500 px-2 py-1" title={trope.description}>
                          <strong>{trope.name}</strong>
                        </td>
                        <td className="border border-gray-500 px-2 py-1">{trope.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect')?.value || 'No text available'}</td>
                        <td className="border border-gray-500 px-2 py-1">
                          {capitalizeFirstLetter(trope.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect')?.value || 'No text available')}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="mt-8 w-full">
            <h2 className="text-2xl font-bold mb-4 text-center">Story Elements</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Include in Prompt</th>
                    <th className="px-4 py-2">Story Element</th>
                    <th className="px-4 py-2">Like</th>
                    <th className="px-4 py-2">Likes</th>
                    <th className="px-4 py-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {storyElements.map((element, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handleCheckboxChange(element.id)}
                            disabled={true}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Link href={`/muertos/storyelements/${element.id}`} className="text-blue-500 hover:underline">
                          {element.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleLikeClick(element.name)}
                          className={`px-2 py-1 rounded ${
                            voteStatus[element.name]
                              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                              : 'bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                          disabled={true}
                        >
                          Like
                        </button>
                      </td>
                      <td className="px-4 py-2">{likes[element.name] || 0}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Comment"
                          value={comments[element.name] || ''}
                          onChange={(e) => handleCommentChange(element.name, e.target.value)}
                          className={`w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            voteStatus[element.name] ? 'disabled' : ''
                          }`}
                          disabled={voteStatus[element.name]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={handlePromptClick}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
              >
                {isLoading ? 'Please wait...' : 'Create (Overwrite) Story Idea'}
              </button>
            </div>

            <div className="mt-6 w-full flex justify-center">
              {isStoryIdeaLoaded && !isEditing ? (
                <div className="w-full lg:w-1/2 p-2 bg-gray-700 text-white rounded border border-gray-500 text-lg">
                  {aiText}
                </div>
              ) : (
                <textarea
                  className="w-full lg:w-1/2 h-32 p-2 bg-gray-700 text-white border border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={aiText}
                  onChange={(e) => handleAiText(e.target.value)}
                />
              )}
            </div>

            {isAiPromptCompleted && (
              <div className="flex justify-center mt-4 mb-4">
                <button
                  onClick={isStoryIdeaLoaded && !isEditing ? () => setIsEditing(true) : handleSaveStoryIdea}
                  className={`px-4 py-2 ${
                    isEditing ? 'bg-green-500' : 'bg-blue-500'
                  } text-white rounded disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={true}
                >
                  {isSaving ? 'Please wait...' : isEditing ? 'Save Story Idea' : 'Edit'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {renderNavigation()}
      </main>
  );
};

export default StoryIdeaDetails;
