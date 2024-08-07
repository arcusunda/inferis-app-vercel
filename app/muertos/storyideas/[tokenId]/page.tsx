'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BaseNFTMetadata } from '../../../../utils/utils';
import { StoryElement, Character, Talent, NFT, StoryIdea } from '../../../types';
import '@/app/globals.css';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

const fetchNFTDetails = async (tokenId: string): Promise<NFT | null> => {
  try {
    const response = await axios.get(`https://ipfs.io/ipfs/${BaseNFTMetadata}/${tokenId}.json`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching NFT details:', (error as any).message);
    return null;
  }
};

const fetchStoryElements = async (attributes: { trait_type: string; value: string }[]): Promise<StoryElement[]> => {
  try {
    const storyElements = await Promise.all(
      attributes.map(async (attr) => {
        const response = await fetch(`/api/storyelements/associations/${encodeURI(attr.value)}`);
        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        }
        return [];
      })
    );

    return storyElements.flat();
  } catch (error) {
    console.error('Error fetching story elements:', (error as any).message);
    return [];
  }
};

const fetchRootStoryElements = async (): Promise<StoryElement[]> => {
  try {
    const response = await fetch('/api/storyelements?isRoot=true');
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } else {
      console.error('Failed to fetch story elements:', response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error fetching story elements:', (error as any).message);
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
    console.error('Error fetching talents:', (error as any).message);
    return [];
  }
};

const fetchCharacterByTokenId = async (tokenId: string): Promise<Character | null> => {
  try {
    const response = await fetch(`/api/characters/${encodeURIComponent(tokenId)}`);
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch character:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching character:', (error as any).message);
    return null;
  }
};

const fetchStoryIdeaByTokenId = async (tokenId: string): Promise<StoryIdea | null> => {
  try {
    const response = await fetch(`/api/storyideas/${encodeURIComponent(tokenId)}`);
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch StoryIdea:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching StoryIdea:', (error as any).message);
    return null;
  }
};

const fetchTotalLikesCount = async (elementName: string): Promise<number> => {
  try {
    const response = await fetch(`/api/storyelements/vote/check-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyElementName: elementName }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.likes || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching total likes count:', (error as any).message);
    return 0;
  }
};

const checkVote = async (elementName: string, tokenId: string, voterAddress: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/storyelements/vote/check-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterAddress,
        tokenId,
        storyElementName: elementName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.likes > 0;
    }
    return false;
  } catch (error) {
    console.error('Error checking vote:', (error as any).message);
    return false;
  }
};

const StoryIdeaDetails = ({ params }: { params: { tokenId: string } }) => {
  const router = useRouter();
  const { tokenId } = params;
  const [nft, setNft] = useState<NFT | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [tropes, setTropes] = useState<StoryElement[]>([]);
  const [aiText, setAiText] = useState<string>('');
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [voteStatus, setVoteStatus] = useState<{ [key: string]: boolean }>({});
  const [checkedElements, setCheckedElements] = useState<{ [key: number]: boolean }>({});
  const [isOwner, setIsOwner] = useState(false);
  const [isStoryIdeaLoaded, setIsStoryIdeaLoaded] = useState(false);
  const [isSaved, setSaved] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const { address } = useAccount();
  const [givenName, setGivenName] = useState('');
  const [nameCheckResult, setNameCheckResult] = useState<string | null>(null);
  const [savedCharacterName, setSavedCharacterName] = useState<string | null>(null);
  const [isCharacterSaved, setIsCharacterSaved] = useState(false);
  const [isNameChecked, setIsNameChecked] = useState(false);
  const [maskStoryElement, setMaskStoryElement] = useState<StoryElement | null>(null);
  const [expressionStoryElement, setExpressionStoryElement] = useState<StoryElement | null>(null);
  const [bodyStoryElement, setBodyStoryElement] = useState<StoryElement | null>(null);
  const [headwearStoryElement, setHeadwearStoryElement] = useState<StoryElement | null>(null);
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
      if (response.ok) {
        const data = await response.json();
        setNfts(data.nfts || []);
        const nftFound = data.nfts.find((nft: NFT) => nft.tokenId === tokenId);
        setNft(nftFound || null);
        setIsOwner(!!nftFound);
      } else {
        console.error('Error:', response.statusText);
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Error fetching NFTs:', (error as any).message);
      setIsOwner(false);
    }
  };

  useEffect(() => {
    if (tokenId && address) {
      fetchNFTs(address);

      const fetchData = async () => {
        const nftData = await fetchNFTDetails(tokenId);
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
              if (element.isRoot) acc[element.id] = true;
              return acc;
            },
            {} as { [key: number]: boolean }
          );

          setCheckedElements(initialCheckedElements);

          const voteStatusData = await Promise.all(
            storyElementsData.map(async (element) => {
              const hasVoted = await checkVote(element.name, tokenId, address);
              return { [element.name]: hasVoted };
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

          const tropesData = await fetchTropes(tokenId);
          setTropes(tropesData);

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

            const storyIdeaData = await fetchStoryIdeaByTokenId(tokenId);

            setSelectedTropes(tropeMap);
            setIsCharacterSaved(true);
          }

          const maskAttribute = nftData.attributes.find((attr) => attr.trait_type === 'Mask');
          const surname = maskAttribute ? maskAttribute.value : 'Unknown';

          const nameResponse = await fetch(`/api/characternames?tokenId=${tokenId}`);
          if (nameResponse.ok) {
            const result = await nameResponse.json();
            if (result) {
              setSavedCharacterName(`${result.givenName} ${result.surname}`);
              setGivenName(`${result.givenName}`);
            }
          }

          const storyIdeaResponse = await fetch(`/api/storyideas/${tokenId}`);
          if (storyIdeaResponse.ok) {
            const storyIdeaResult = await storyIdeaResponse.json();
            if (storyIdeaResult) {
              setAiText(storyIdeaResult.text);
              setIsStoryIdeaLoaded(true);
              setIsAiPromptCompleted(true);
            }
          }
        }
      };
      fetchData();
    }
  }, [tokenId, address]);

  useEffect(() => {
    if (nft) {
      const fetchStoryElements = async () => {
        const bodyAttribute = nft.attributes.find((attr) => attr.trait_type === 'Body')?.value;
        const maskAttribute = nft.attributes.find((attr) => attr.trait_type === 'Mask')?.value;
        const expressionAttribute = nft.attributes.find((attr) => attr.trait_type === 'Expression')?.value;
        const headwearAttribute = nft.attributes.find((attr) => attr.trait_type === 'Headwear')?.value;

        const [bodyResponse, maskResponse, expressionResponse, headwearResponse] = await Promise.all([
          fetch(`/api/storyelementsname/${encodeURI(bodyAttribute || 'Unknown name')}`),
          fetch(`/api/storyelementsname/${encodeURI(maskAttribute || 'Unknown name')}`),
          fetch(`/api/storyelementsname/${encodeURI(expressionAttribute || 'Unknown name')}`),
          headwearAttribute ? fetch(`/api/storyelementsname/${encodeURI(headwearAttribute)}`) : Promise.resolve(null),
        ]);

        setBodyStoryElement(await bodyResponse.json());
        setMaskStoryElement(await maskResponse.json());
        setExpressionStoryElement(await expressionResponse.json());
        setHeadwearStoryElement(headwearResponse ? await headwearResponse.json() : null);
      };

      fetchStoryElements();
    }
  }, [nft]);

  useEffect(() => {
    if (isAiPromptCompleted) {
      // Save the story idea as soon as AI prompt is completed
      handleSaveStoryIdea();
    }
  }, [isAiPromptCompleted]);

  useEffect(() => {
    if (aiText) {
      const timerId = setTimeout(() => {
        handleSaveStoryIdea();
      }, 500); // Adjust the debounce time as necessary

      return () => clearTimeout(timerId);
    }
  }, [aiText]);

  const handleCreateStoryIdea = async () => {
    setIsLoading(true);
    setIsAiPromptCompleted(false);

    const [loglineResponse] = await Promise.all([
      fetch(`/api/rootprompts/Logline?promptName=Logline`),
    ]);

    const loglineData = await loglineResponse.json()

    try {
        const elementIds = storyElements.map((el) => el.id).join(',');
        const tropeIds = tropes.map((trope) => trope.id).join(',');

        const bodyData = bodyStoryElement?.attributes?.find((attr) => attr.trait_type === 'Text')?.value || '';
        const maskData = maskStoryElement?.attributes?.find((attr) => attr.trait_type === 'Text')?.value || '';
        const expressionData = expressionStoryElement?.attributes?.find((attr) => attr.trait_type === 'Text')?.value || '';
        const headwearData = headwearStoryElement?.attributes?.find((attr) => attr.trait_type === 'Text')?.value || '';

        const aiPrompt = `${loglineData.promptText}`;

        const requestBody = {
            aiPrompt,
            storyElementIds: elementIds,
            tropeIds,
            bodyData,
            maskData,
            expressionData,
            headwearData,
        };
/*
        const aiResponse = await fetch('/api/storyelements/associations/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
*/
        const aiResponse = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            setAiText(aiData.aiText);
            setIsAiPromptCompleted(true);
        } else {
            console.error('Error fetching AI response:', aiResponse.statusText);
        }
    } catch (error) {
      console.error('Error creating story idea:', (error as any).message);
    } finally {
      setIsLoading(false);
    }
};


  const handleLikeClick = async (elementName: string) => {
    const comment = comments[elementName] || '';
    const vote = 'Yes';

    try {
      const response = await fetch('/api/storyelements/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterAddress: address,
          tokenId,
          storyElementName: elementName,
          vote,
          comment,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikes((prevLikes) => ({ ...prevLikes, [elementName]: data.likes }));
        setVoteStatus((prevStatus) => ({ ...prevStatus, [elementName]: true }));
      }
    } catch (error) {
      console.error('Error liking element:', (error as any).message);
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
      givenName,
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

    try {
      const response = await fetch(`/api/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(character),
      });

      if (response.ok) {
        setIsCharacterSaved(true);
        setGivenName('');
        setNameCheckResult(null);
        setIsNameChecked(false);
      } else {
        console.error('Failed to save character');
      }
    } catch (error) {
      console.error('Error saving character:', (error as any).message);
    }
  };

  const handleCheckboxChange = (elementId: number) => {
    setCheckedElements((prevChecked) => ({
      ...prevChecked,
      [elementId]: !prevChecked[elementId],
    }));
  };

  const handleEditButtonClick = () => {
    if (isSaved) {
      handleSaveStoryIdea();
    } else {
      setSaved(true);
    }
  };

  const handleSaveStoryIdea = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/storyideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: aiText, tokenId, image: nft?.image, state: 'Draft', address }),
      });

      if (response.ok) {
        setIsStoryIdeaLoaded(true);
        setSaved(true);
        setShowSaveMessage(true); // Show the save message
        setTimeout(() => setShowSaveMessage(false), 3000); // Hide the message after 3 seconds
      } else {
        console.error('Failed to save story idea');
      }
    } catch (error) {
      console.error('Error saving story idea:', (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const categoryToTropeType = useCallback((categoryType: string): string => {
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
  }, []);

  const handleTropeSelect = (categoryType: string, tropeId: number) => {
    const traitType = categoryToTropeType(categoryType);
    if (!traitType) return;

    setSelectedTropes((prevSelected) => {
      const newSelected = { ...prevSelected };
      const updatedSet = new Set(newSelected[traitType]);

      if (updatedSet.has(tropeId)) {
        updatedSet.delete(tropeId);
      } else {
        updatedSet.add(tropeId);
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

  const handleGivenName = (name: string) => {
    const matches = matcher.getAllMatches(name);
    const censoredName = censor.applyTo(name, matches);
    setGivenName(censoredName);
    setSavedCharacterName(null);
    setNameCheckResult(null);
  };

  const handleCheckName = async () => {
    if (!givenName.trim()) {
      setNameCheckResult('Please enter a given name');
      return;
    }

    if (!nft) return;

    const maskAttribute = nft.attributes.find((attr) => attr.trait_type === 'Mask');
    const surname = maskAttribute ? maskAttribute.value : 'Unknown';

    try {
      const response = await fetch(`/api/characternames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ givenName, surname, tokenId: parseInt(tokenId, 10) }),
      });

      if (response.ok) {
        setNameCheckResult('Name available.');
        setIsNameChecked(true);
      } else {
        const result = await response.json();
        setNameCheckResult(result.error || 'Error checking name');
        setIsNameChecked(false);
      }
    } catch (error) {
      console.error('Error checking name:', (error as any).message);
      setNameCheckResult('Error checking name');
      setIsNameChecked(false);
    }
  };

  const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

  const handleAiTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = event.target.value;
    const matches = matcher.getAllMatches(inputText);
    const censoredText = censor.applyTo(inputText, matches);
    setAiText(censoredText);
  };

  const renderNavigation = useCallback(() => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-center items-center space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/assets/" className="text-white hover:text-gray-300">
            Your Muertos
          </Link>
        </li>
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/storyelements/create" className="text-white hover:text-gray-300">
            Story Elements
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
  ), []);

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
          <h2 className="text-lg font-bold mb-2">{savedCharacterName || nft.name}</h2>
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
            <h2 className="text-2xl font-bold mb-4 text-center">Selected Tropes</h2>
            <p className="mb-2 text-xs mb-4 text-center">
                Missing Mask, Body, or Expression? Check back soon.
              </p>
            <table className="w-full border-collapse border border-gray-500">
              <thead>
                <tr>
                  <th className="border border-gray-500 px-2 py-1">Trope</th>
                  <th className="border border-gray-500 px-2 py-1">Name</th>
                </tr>
              </thead>
              <tbody>
                {tropes.map((trope) => (
                  <tr key={trope.id} className="border border-gray-500">
                    <td className="border border-gray-500 px-2 py-1">
                      {trope.attributes?.find((attr: { trait_type: string }) => attr.trait_type === 'Aspect')?.value || 'No text available'}
                    </td>
                    <td
                      className="border border-gray-500 px-2 py-1"
                      title={trope.attributes?.find((attr: { trait_type: string }) => attr.trait_type === 'Text')?.value}
                    >
                      {trope.name}
                    </td>
                  </tr>
                ))}
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
                            checked={checkedElements[element.id]}
                            onChange={() => handleCheckboxChange(element.id)}
                            disabled={!element.isRoot}
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
                          className={`px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                            voteStatus[element.name]
                              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                              : 'bg-blue-500 text-white'
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
                          className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                onClick={handleCreateStoryIdea}
                className={`px-4 py-2 rounded ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : 'Create New Story Idea'}
              </button>
          </div>

          <div className="mt-6 w-full flex justify-center">
            {isStoryIdeaLoaded && !isSaved ? (
              <div className="w-full lg:w-1/2 p-2 bg-gray-700 text-white rounded border border-gray-500 text-lg">
                {aiText}
              </div>
            ) : (
              <textarea
                className="w-full lg:w-1/2 h-32 p-2 bg-gray-700 text-white border border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={aiText}
                onChange={handleAiTextChange}
              />
            )}
          </div>
          {showSaveMessage && (
            <div className="mt-4 text-center text-green-500">
              Story idea saved
            </div>
          )}

          {isStoryIdeaLoaded && (
            <div className="mt-8 w-full flex justify-center">
              <Link href="/muertos/storyideas" className="bg-blue-500 text-white px-4 py-2 rounded">
                  View Story Ideas
              </Link>
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
