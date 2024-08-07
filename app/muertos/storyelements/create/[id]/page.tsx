'use client'

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { StoryElement, NFT } from '../../../../types';
import { IpfsBaseUrl } from '../../../../../utils/utils';
import '@/app/globals.css';
import { version } from 'os';

type CreateStoryElementPageProps = {
    params: {
      id: string;
    };
  };
  
const CreateStoryElement = ({ params }: CreateStoryElementPageProps) => {
    const tokenId = params.id;
    const { open } = useWeb3Modal();
    const { address } = useAccount();
    const [nft, setNft] = useState<NFT | null>(null);
    const [aspectFilter, setAspectFilter] = useState<string>('All');
    const [isLoading, setIsLoading] = useState(false);
    const [isAiPromptCompleted, setIsAiPromptCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [aiText, setAiText] = useState<string>('');
    const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
    const [maskStoryElement, setMaskStoryElement] = useState<StoryElement | null>(null);
    const [bodyStoryElement, setBodyStoryElement] = useState<StoryElement | null>(null);
    const [headwearStoryElement, setHeadwearStoryElement] = useState<StoryElement | null>(null);
    const [parsedJson, setParsedJson] = useState<StoryElement | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [showSaveMessage, setShowSaveMessage] = useState(false);
    const [isStoryElementLoaded, setIsStoryElementLoaded] = useState(false);
    const [isSaved, setSaved] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
  
    useEffect(() => {
        if (nft) {
            const fetchStoryElements = async () => {
                const bodyAttribute = nft.attributes.find((attr) => attr.trait_type === 'Body')?.value;
                const maskAttribute = nft.attributes.find((attr) => attr.trait_type === 'Mask')?.value;
                const headwearAttribute = nft.attributes.find((attr) => attr.trait_type === 'Headwear')?.value;

                const [bodyResponse, maskResponse, headwearResponse] = await Promise.all([
                    fetch(`/api/storyelementsname/${encodeURI(bodyAttribute || 'Unknown name')}`),
                    fetch(`/api/storyelementsname/${encodeURI(maskAttribute || 'Unknown name')}`),
                    headwearAttribute ? fetch(`/api/storyelementsname/${encodeURI(headwearAttribute)}`) : Promise.resolve(null),
                ]);

                setBodyStoryElement(await bodyResponse.json());
                setMaskStoryElement(await maskResponse.json());
                setHeadwearStoryElement(headwearResponse ? await headwearResponse.json() : null);
            };

            fetchStoryElements();
        }
    }, [nft]);

    useEffect(() => {

          const fetchStoryElements = async () => {
            if (address) {
                const response = await fetch(`/api/storyelements?address=${address}`);
                if (response.ok) {
                    const data = await response.json();
                    setStoryElements(data);
                } else {
                    console.error('Failed to fetch story elements:', response.statusText);
                }
            }
        };

        fetchStoryElements();
    }, [address]);

    const handleAspectFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setAspectFilter(e.target.value);
    };
/*
    useEffect(() => {
        if (isAiPromptCompleted) {
          handleSaveStoryElement();
        }
      }, [isAiPromptCompleted]);
*/    
      useEffect(() => {
        if (aiText) {
          const timerId = setTimeout(() => {
            handleSaveStoryElement();
          }, 500); // Adjust the debounce time as necessary
    
          return () => clearTimeout(timerId);
        }
      }, [aiText]);
    
    const handleSaveStoryElement = async () => {
        setIsSaving(true);

        const aspect = parsedJson?.attributes?.find(attr => attr.trait_type === 'Aspect')?.value;
        const text = parsedJson?.attributes?.find(attr => attr.trait_type === 'Text')?.value;
        const parents = parsedJson?.attributes?.find(attr => attr.trait_type === 'Parents')?.value;

      try {
        const response = await fetch('/api/storyelements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newStoryElement: {
            name: parsedJson?.name,
            description: parsedJson?.description,
            image: parsedJson?.image,
            aspect: aspect,
            text: text,
            parents,
            state: 'Draft',
            address,
            tokenId: tokenId
          }}),

        });
    
          if (response.ok) {
            setIsStoryElementLoaded(true);
            setSaved(true);
            setShowSaveMessage(true);
            setTimeout(() => setShowSaveMessage(false), 3000);
          } else {
            console.error('Failed to save story idea');
          }
        } catch (error) {
          console.error('Error saving story idea:', (error as any).message);
        } finally {
          setIsSaving(false);
        }
      };
    
    const handleCreateStoryElement = async () => {
        setIsLoading(true);
        setIsAiPromptCompleted(false);

        const elementIds = storyElements.map((el) => el.id).join(',');

        const bodyData = bodyStoryElement?.attributes?.find((attr) => attr.trait_type === 'Text')?.value || '';
        const maskData = maskStoryElement?.attributes?.find((attr) => attr.trait_type === 'Text')?.value || '';
        const headwearData = headwearStoryElement?.attributes?.find((attr) => attr.trait_type === 'Text')?.value || '';

        const [loglineResponse] = await Promise.all([
            fetch(`/api/rootprompts/Logline?promptName=StoryElement`),
        ]);

        const loglineData = await loglineResponse.json()

        try {
            const aiPrompt = `${loglineData.promptText}`;

            const requestBody = {
                aspect: aspectFilter,
                bodyData,
                maskData,
                headwearData,
            };

            const aiResponse = await fetch('/api/claude/storyelements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                setAiText(aiData.aiText);
                setIsAiPromptCompleted(true);

                // Attempt to parse the JSON response
                try {
                    const parsed = JSON.parse(aiData.aiText);
                    setParsedJson(parsed);
                    setImageUrl(getImageUrl(parsed.image || ''));
                    setJsonError(null);
                } catch (error) {
                    setJsonError('Invalid JSON: ' + (error as any).message);
                    setParsedJson(null);
                }

            } else {
                console.error('Error fetching AI response:', aiResponse.statusText);
            }

        } catch (error) {
            console.error('Error creating story idea:', (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (ipfsUrl: string) => {
        if (ipfsUrl.startsWith('ipfs://')) {
            const url = ipfsUrl.replace('ipfs://', `${IpfsBaseUrl}/`);
            return url;
        }
        return ipfsUrl;
    };

    const renderNavigation = () => (
        <nav className="bg-gray-800 p-4 dark:bg-gray-900">
            <ul className="flex justify-center items-center space-x-4">
                <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400 dark:after:bg-gray-600">
                    <Link href="/muertos" className="text-white hover:text-gray-300">
                        Home
                    </Link>
                </li>
                <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400 dark:after:bg-gray-600">
                    <Link href="/muertos/storyelements/create" className="text-white hover:text-gray-300">
                    Story Elements
                    </Link>
                </li>
                <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400 dark:after:bg-gray-600">
                    <Link href="/muertos/storyideas" className="text-white hover:text-gray-300">
                        Story Ideas
                    </Link>
                </li>
                <li>
                    <w3m-button />
                </li>
            </ul>
        </nav>
    );

    const handleImageEdit = () => {
        setIsEditingImage(true);
    };

    const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        setImageUrl(e.target.value);
    };

    const handleImageUrlBlur = () => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            setIsEditingImage(false);
            if (parsedJson) {
                setParsedJson({ ...parsedJson, image: imageUrl });
            }
        };
        img.onerror = () => {
            console.error('Invalid image URL');
        };
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            {renderNavigation()}
            {!address ? (
                <div className="flex flex-wrap justify-center gap-6">
                    <p className="text-xl text-gray-500">Please connect your wallet</p>
                </div>
            ) : (
                <div className="mt-6 p-4 bg-gray-100 rounded shadow-md w-full max-w-lg dark:bg-gray-900 dark:text-gray-100">
                    <p className="text-2xs mb-6 text-center">
                        Create your own unique story element for the fictional series <em>Tali and the 10,000 Muertos</em> using TokenId: {tokenId}
                    </p>
                    <div className="flex justify-center mb-6">
                        <label htmlFor="aspect-filter" className="mr-4 text-lg">
                            Choose an Aspect:
                        </label>
                        <select
                            id="aspect-filter"
                            value={aspectFilter}
                            onChange={handleAspectFilterChange}
                            className="bg-gray-700 text-white rounded px-4 py-2 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="Magical Item">Magical Item</option>
                            <option value="Magical Creature">Magical Creature</option>
                            <option value="Magic System">Magic System</option>
                            <option value="Character">Character</option>
                            <option value="Secret Society">Secret Society</option>
                            <option value="Cryptic Clue">Cryptic Clue</option>
                            <option value="Setting">Setting</option>
                            <option value="Character - Mortal Antagonist">Mortal Antagonist</option>
                        </select>
                    </div>
                    <button
                        onClick={handleCreateStoryElement}
                        className={`px-4 py-2 rounded ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white dark:bg-blue-600 dark:text-gray-100'}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Please wait...' : 'Create (Overwrite) Story Element'}
                    </button>
                    {parsedJson ? (
                        <div className="mt-6 p-4 bg-gray-100 rounded shadow-md w-full max-w-lg dark:bg-gray-900 dark:text-gray-100">
                            <h2 className="text-xl font-bold mb-2">Generated Story Element</h2>
                            <p><strong>Name:</strong> {parsedJson.name}</p>
                            <p><strong>Description:</strong> {parsedJson.description}</p>
                            <p><strong>Associated Token ID:</strong> {tokenId}</p>
                            {parsedJson.image && !isEditingImage ? (
                                <div className="relative">
                                    <img
                                        src={imageUrl}
                                        alt={parsedJson.name}
                                        className="w-64 h-64 object-cover rounded mb-4 md:mb-0 md:mr-4"
                                    />
                                    <button
                                        onClick={handleImageEdit}
                                        className="absolute top-2 right-2 bg-gray-300 text-black px-2 py-1 rounded text-xs dark:bg-gray-700 dark:text-white"
                                    >
                                        Edit Image
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={handleImageUrlChange}
                                        onBlur={handleImageUrlBlur}
                                        className="bg-gray-200 text-black rounded px-4 py-2 w-full dark:bg-gray-800 dark:text-gray-200"
                                    />
                                </div>
                            )}
                                    <p><strong>Aspect:</strong> {parsedJson.attributes?.find(attr => attr.trait_type === 'Aspect')?.value}</p>
                                    <p><strong>Text:</strong> {parsedJson.attributes?.find(attr => attr.trait_type === 'Text')?.value}</p>
                                    <p><strong>Parents:</strong> {parsedJson.attributes?.find(attr => attr.trait_type === 'Parents')?.value}</p>
                                    {showSaveMessage && (
                                        <div className="text-xs mt-4 text-center gap-6 text-green-500">
                                            Story idea saved
                                        </div>
                                    )}
                                </div>
                            ) : (
                                jsonError && (
                                    <div className="mt-6 p-4 bg-red-100 rounded shadow-md w-full max-w-lg dark:bg-red-900 dark:text-gray-100">
                                        <h2 className="text-xl font-bold mb-2">Error Parsing JSON</h2>
                                        <p>{jsonError}</p>
                                        <pre className="mt-2 p-2 bg-gray-200 rounded dark:bg-gray-800 dark:text-gray-200">{aiText}</pre>
                                    </div>
                                )
                            )}
                        </div>
            )}

            {!address ? (
            <div className="flex flex-wrap justify-center gap-6">
            <p className="text-xl text-gray-500">Please connect your wallet</p>
            </div>
            ) : !storyElements || storyElements.length < 1 ? (
                <div className="flex flex-wrap justify-center gap-6">
                <p className="text-xl text-gray-500">No Story Elements found</p>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center gap-6 mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-center">Your existing Story Elements</h2>
                    <div className="flex flex-wrap justify-center gap-6">
                        {storyElements.map((element) => (
                            <Link href={`/muertos/storyelements/${element.id}`} key={element.id} className="border border-gray-300 rounded-lg p-4 max-w-xs text-center">
                                <img
                                    src={element.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                    alt={`ID: ${element.id}`}
                                    className="w-40 h-auto rounded mb-4"
                                />
                                <div className="text-sm text-gray-400">
                                    <p><strong>Name:</strong> {element.name}</p>
                                    <p><strong>Description:</strong> {element.description}</p>
                                    <p><strong>Associated Token ID:</strong> {element.tokenId ? element.tokenId : "N/A"}</p>
                                    {element.attributes && (
                                    <div className="text-left">
                                        {element.attributes.map((attr, idx) => (
                                        <p key={idx}><strong>{attr.trait_type}:</strong> {attr.value}</p>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
};

export default CreateStoryElement;
