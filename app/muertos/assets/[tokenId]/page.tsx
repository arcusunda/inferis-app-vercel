'use client'

import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BaseNFTMetadata } from '../../../../utils/utils';
import { Character, NFT, StoryElement } from '../../../types';
import '@/app/globals.css';
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { useAccount } from "wagmi"
import { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } from 'obscenity';

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
  const [nft, setNft] = useState<NFT | null>(null);
  const [storyElements, setStoryElements] = useState<{ [aspect: string]: StoryElement[] }>({} as { [aspect: string]: StoryElement[] });
  const [selectedStoryElements, setSelectedStoryElements] = useState<{ [aspect: string]: number | null }>({});
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

  const aspects = [
    "Magical Item",
    "Magical Creature",
    "Cryptic Clue",
    "Secret Society",
    "Character - Mortal Antagonist"
  ];

  const fetchNFTs = async (address: string) => {
    try {
      const response = await fetch(`/api/alchemy/fetchmetadata?wallet=${address}`);
      const data = await response.json();
      if (response.ok) {
        if (data.nfts) {
          setIsOwner(data.nfts.some((nft: { tokenId: string; }) => nft.tokenId === tokenId));
          return data.nfts;
        }
      }
      setIsOwner(false);
      return [];
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setIsOwner(false);
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
          const fetchElementsByAspects = async () => {
            const elements = await Promise.all(aspects.map(aspect => fetchStoryElementsByAspect(aspect)));
            const elementsMap = aspects.reduce((acc, aspect, index) => {
              acc[aspect] = elements[index];
              return acc;
            }, {});
            setStoryElements(elementsMap);
          };

          fetchElementsByAspects();

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

  const handleSaveCharacter = async () => {
    if (!nft) {
      console.error('NFT is null');
      return;
    }

    console.info('nft.tokenId:', nft.tokenId);

    const character = {
      id: 1,
      name: nft.name,
      description: "A character sheet for this Muerto.",
      image: nft.image,
      wallet: address,
      tokenId: tokenId,
      givenName: givenName,
      attributes: [
        {
          trait_type: "StoryElements",
          value: Object.values(selectedStoryElements).filter(Boolean).join(', ')
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
      setIsCharacterSaved(true);
      setNameCheckResult(null);
      setIsNameChecked(false);
      const maskAttribute = nft.attributes.find((attr: { trait_type: string; }) => attr.trait_type === 'Mask');
      const surname = maskAttribute ? maskAttribute.value : 'Unknown';
      setSavedCharacterName(givenName + ' ' + surname);
    } else {
      console.error('Failed to save character');
    }
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

    const maskAttribute = nft?.attributes.find((attr: { trait_type: string; }) => attr.trait_type === 'Mask');
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

  const handleStoryElementSelect = (aspect: string, elementId: number) => {
    setSelectedStoryElements((prevSelected) => ({
      ...prevSelected,
      [aspect]: prevSelected[aspect] === elementId ? null : elementId,
    }));
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
              {nft.attributes.map((attr: { trait_type: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; value: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }, index: Key | null | undefined) => (
                <p key={index} className="mb-1"><strong>{attr.trait_type}:</strong> {attr.value}</p>
              ))}
            </div>
            <div className="text-sm text-gray-400 w-full lg:w-1/2">
              <div className="mt-6">
                <h2 className="text-lg font-bold mb-2">Select one StoryElement per Aspect. (Hover for description)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-500">
                    <thead>
                      <tr>
                        <th className="border border-gray-500 px-2 py-1">Select</th>
                        <th className="border border-gray-500 px-2 py-1">Element Name</th>
                        <th className="border border-gray-500 px-2 py-1">Aspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aspects.map(aspect => (
                        storyElements[aspect]?.map((element) => (
                          <tr key={element.id} className="border border-gray-500">
                            <td className="border border-gray-500 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={selectedStoryElements[aspect] === element.id}
                                onChange={() => handleStoryElementSelect(aspect, element.id)}
                              />
                            </td>
                            <td className="border border-gray-500 px-2 py-1" title={element.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Text')?.value || 'No text available'}>
                              <strong>{element.name}</strong>
                            </td>
                            <td className="border border-gray-500 px-2 py-1">{element.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect')?.value || 'No text available'}</td>
                          </tr>
                        ))
                      ))}
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
                  <Link href={`/muertos/storyideas/${tokenId}`} key={tokenId} className="border border-gray-300 rounded-lg p-4 max-w-xs text-center">
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
        </div>
      )}
    </main>
  );

};

export default NFTDetails;
