'use client'

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { StoryElement, NFT } from '../../../types';
import { IpfsBaseUrl } from '../../../../utils/utils';
import '@/app/globals.css';

type CreateStoryElementPageProps = {
    params: {
      tokenId: string;
    };
  };
  
const CreateStoryElement = ({ params }: CreateStoryElementPageProps) => {
    const { tokenId } = params;
    const { open } = useWeb3Modal();
    const { address } = useAccount();
    const [nfts, setNfts] = useState([]);
    const [nft, setNft] = useState<NFT | null>(null);
    const [aspectFilter, setAspectFilter] = useState<string>('Magical Item');
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
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        wbpImage: '',
        aspect: '',
        isRoot: false,
        attributes: [],
        state: '',
        ipId: '',
        licenseTermsId: '',
        derivativeRegistration: '',
        isRegistered: false,
        childrenData: [],
        licenseTokenId: '',
        dateCanonized: '',
        dateRegistered: '',
        isTokenized: false,
        author: '',
        isSubmitted: false,
        created: '',
        updated: ''
    });

    const router = useRouter();

    useEffect(() => {
        setLoading(true);
        fetchNFTs(address as string);
        const savedNfts = localStorage.getItem('nfts');
    
        if (savedNfts) {
          setNfts(JSON.parse(savedNfts));
          localStorage.setItem('nfts', JSON.stringify(nfts));
        }
        setLoading(false);
      }, []);
    
        const fetchNFTs = async (address: string) => {
        try {
            const response = await fetch(`/api/alchemy/fetchmetadata?wallet=${address}`);
            const data = await response.json();
            if (response.ok) {
            setNfts(data.nfts);
            return data.nfts;
            } else {
            console.error('Error:', data.error);
            return [];
            }
        } catch (error) {
            console.error('Error fetching NFTs:', error);
            return [];
        }
    };
    
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

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        });
    };

    const handleAspectFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setAspectFilter(e.target.value);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = await fetch('/api/storyelements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                created: new Date(),
                updated: new Date(),
            })
        });

        if (response.ok) {
            router.push('/storyelements');
        } else {
            console.error('Failed to create story element:', response.statusText);
        }
    };

    useEffect(() => {
        if (isAiPromptCompleted) {
          handleSaveStoryElement();
        }
      }, [isAiPromptCompleted]);
    
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
            tokenId: parseInt(tokenId),
          }}),

        });
    
          if (response.ok) {
            setIsStoryElementLoaded(true);
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
                    <Link href="/muertos/storyelements/create/" className="text-white hover:text-gray-300">
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
        <main className="flex flex-col min-h-screen p-6">
          {renderNavigation()}
          {!address ? (
            <div className="flex flex-wrap justify-center gap-6">
              <p className="text-xl text-gray-500">Please connect your wallet</p>
            </div>
          ) : !nfts || nfts.length < 1 ? (
            <>
              <div className="flex flex-wrap justify-center gap-6">
                <p className="text-xl text-gray-500">No Muertos found</p>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                <p className="text-xl text-gray-500">Visit Los Muertos World</p>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                <p className="text-xl text-gray-500"> at </p>
              </div>
              <div className="flex justify-center items-center space-x-4">
                <Link href="https://opensea.io/collection/los-muertos-world" target="_blank">
                  <img src="/opensea-logo.png" alt="Visit Los Muertos World at OpenSea" className="w-10 h-10" />
                </Link>
                <p className="text-xl text-gray-500"> or </p>
                <Link href="https://magiceden.io/collections/ethereum/0xc878671ff88f1374d2186127573e4a63931370fc" target="_blank">
                  <img src="/magiceden-logo.png" alt="Visit Los Muertos World at Magic Eden" className="w-10 h-10" />
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex flex-wrap justify-center gap-1 w-full">
              <h1 className="text-xl font-bold mb-4 text-center w-full">Choose a Muerto</h1>
              <h2 className="text-l font-bold mb-4 text-center w-full">Each muerto grants you generation of one Story Element</h2>
              </div>
              <div className="w-full"></div>

              {nfts.map((nft: { tokenId: string; image: string; name: string; owner: string; stakedAt: string; attributes: { trait_type: string; value: string; }[] }, index) => (
                nft && (
                  <Link href={`/muertos/storyelements/create/${nft.tokenId}`} key={index} className="border border-gray-300 rounded-lg p-4 max-w-xs text-center">
                    <img
                      src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                      alt={`Token ID: ${nft.tokenId}`}
                      className="w-40 h-auto rounded mb-4"
                    />
                    <div className="text-sm text-gray-400">
                      <p><strong>Name:</strong> {nft.name}</p>
                      <p><strong>Token ID:</strong> {nft.tokenId}</p>
                      {nft.attributes && (
                        <div>
                          <p><strong>Mask:</strong> {nft.attributes.find(attr => attr.trait_type === 'Mask')?.value || 'N/A'}</p>
                          <p><strong>Body:</strong> {nft.attributes.find(attr => attr.trait_type === 'Body')?.value || 'N/A'}</p>
                          <p><strong>Expression:</strong> {nft.attributes.find(attr => attr.trait_type === 'Expression')?.value || 'N/A'}</p>
                          <p><strong>Headwear:</strong> {nft.attributes.find(attr => attr.trait_type === 'Headwear')?.value || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              ))}
            </div>
          )}
        </main>
      );
    };

export default CreateStoryElement;
