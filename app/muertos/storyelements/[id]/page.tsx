'use client'

import { SetStateAction, useEffect, useState } from 'react';
import Link from 'next/link';
import { StoryElement, Crafting, ChildData } from '../../../types';
import { CurrencyAddress, IpfsBaseUrl, NFTContractAddress } from '../../../../utils/utils';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { custom } from 'viem'
import { Address } from 'viem/accounts';
import { connectMetaMask } from '../../../../utils/metamask';
import '@/app/globals.css';

type StoryElementDetailProps = {
  params: {
    id: string;
  };
};
const StoryElementDetail = ({params}: StoryElementDetailProps) => {
  const { id } = params;
  const [storyElement, setStoryElement] = useState<StoryElement | null>(null);
  const [children, setChildren] = useState<StoryElement[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [buttonState, setButtonState] = useState<{ [parent: string]: 'Mint' | 'Register as Derivative' | 'Registered as Derivative' | 'Please wait...' }>({});
  const [loadingState, setLoadingState] = useState<{ [parent: string]: boolean }>({});
  const [craftings, setCraftings] = useState<Crafting[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState("2");

  useEffect(() => {
    if (id) {
      const idStr = Array.isArray(id) ? id[0] : id;
      fetch(`/api/storyelements/${idStr}`)
        .then(response => response.json())
        .then(data => {
          const storyElementData = {
            ...data,
            dateCanonized: data.dateCanonized ? new Date(data.dateCanonized) : undefined,
            dateRegistered: data.dateRegistered ? new Date(data.dateRegistered) : undefined,
            created: new Date(data.created),
            updated: data.updated ? new Date(data.updated) : undefined,
          };
  
          fetch(`/api/storyelements/craftings/${encodeURI(data.name)}`)
            .then(response => response.json())
            .then(data => setCraftings(data));
  
          if (storyElementData?.childrenData) {
            setStoryElement(storyElementData);
          } else {
            fetch(`/api/storyelements/children/${encodeURI(data.name)}`)
              .then(response => response.json())
              .then(childrenData => {
                if (Array.isArray(childrenData)) {
                  const filteredChildrenData = childrenData.filter(child => child.isRegistered).map(child => ({
                    childName: child.name,
                    ipId: child.ipId,
                    isRoyaltyTokensCollected: child.isRoyaltyTokensCollected,
                    royaltyTokensCollected: child.royaltyTokensCollected,
                    snapshotId: child.snapshotId,
                    revenueTokensClaimed: child.revenueTokensClaimed,
                  }));
  
                  const updatedStoryElementData = {
                    ...storyElementData,
                    childrenData: filteredChildrenData
                  };
  
                  setStoryElement(updatedStoryElementData);
                } else {
                  setStoryElement({ ...storyElementData, childrenData: [] });
                  console.warn('No childrenData array found.');
                }
              })
              .catch(error => console.error('Failed to fetch children data:', error));
          }
  
          const parentsAttribute = storyElementData.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Parents');
          const initialButtonState = (parentsAttribute?.value.split(', ') || []).reduce((acc: { [key: string]: string }, parent: string) => {
            acc[parent] = storyElementData.derivativeRegistration === parent ? 'Registered as Derivative' : 'Mint';
            return acc;
          }, {});
          setButtonState(initialButtonState);
        })
        .catch(error => console.error('Failed to fetch story element data:', error));
    }
  }, [id]);
  
    

  if (!storyElement) {
    return <div>Loading...</div>;
  }

  const fetchData = async (storyElementName: string): Promise<StoryElement | null> => {
    const response = await fetch(`/api/storyelements/${encodeURI(storyElementName)}`);
    if (response.ok) {
      const data = await response.json();

      const storyElement: StoryElement = {
        ...data,
        dateCanonized: data.dateCanonized ? new Date(data.dateCanonized) : undefined,
        dateRegistered: data.dateRegistered ? new Date(data.dateRegistered) : undefined,
        created: new Date(data.created),
        updated: data.updated ? new Date(data.updated) : undefined,
      };
      return storyElement;
    } else {
      console.error('Failed to fetch StoryElement:', response.statusText);
      return null;
    }
  };

  const getImageUrl = (ipfsUrl: string) => {
    if (ipfsUrl.startsWith('ipfs://')) {
      const url = ipfsUrl.replace('ipfs://', `${IpfsBaseUrl}/`);
      return url;
    }
    return ipfsUrl;
  };

  const handleRegister = async (storyElementName: string) => {
    setLoading(true);
    const storyElement = await fetchData(storyElementName);

    try {
      const account: Address = await connectMetaMask();

      try {
        if (!account || !storyElement) return;

        const config: StoryConfig = {
          account: account,
          transport: custom(window.ethereum),
          chainId: 'sepolia',
        }
        const client = StoryClient.newClient(config)
        const tokenId = storyElement ? storyElement.id : 1;

        const registeredIpAssetResponse = await client.ipAsset.register({
          nftContract: NFTContractAddress,
          tokenId: tokenId,
          txOptions: { waitForTransaction: true }
        });

        const response = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: storyElement.id, ipId: registeredIpAssetResponse.ipId, state: 'Registered', isRegistered: true })
        });

        if (response.ok) {
          const updatedStoryElement = {
            ...storyElement,
            state: 'Registered',
            isRegistered: true,
            dateRegistered: new Date(),
            ipId: registeredIpAssetResponse.ipId,
          };
               
        } else {
          console.error('Failed to update story element:', response.statusText);
        }
        
        setStoryElement(storyElement);

      } catch (error) {
          console.log(error)
          throw error;
      } finally {
        setLoading(false);
      }

    } catch (error) {
      console.error('Failed to register IP Asset:', error);
    }
  };

  const attachLicenseTerms = async (storyElementName: string, selectedLicense: string, licenseName: string) => {
    const storyElement = await fetchData(storyElementName);

    const account: Address = await connectMetaMask();

    if (!account || !storyElement) return;

    const config: StoryConfig = {
      account: account,
      transport: custom(window.ethereum),
      chainId: 'sepolia', // TODO:
    }

    const client = StoryClient.newClient(config)

    console.info(`Attaching license terms to ${storyElement.name} with selectedLicense ${selectedLicense}`); 
    const attachPolicyResponse = await client.license.attachLicenseTerms({
      licenseTermsId: selectedLicense,
      ipId: storyElement.ipId!,
      txOptions: { waitForTransaction: true },
    })

    const response = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: storyElement.id, licenseTermsId: selectedLicense, state: "LicenseTermsAttached" })
    });

  }

  const mintLicenseTokens = async (parentName: string, childName: string) => {
    setLoadingState((prevState) => ({ ...prevState, [parentName]: true }));
    setButtonState((prevState) => ({ ...prevState, [parentName]: 'Please wait...' }));

    const parentStoryElement = await fetchData(parentName);
    setStoryElement(await fetchData(childName));

    if (!parentStoryElement || !storyElement) {
      return;
    }

    const account: Address = await connectMetaMask();

    if (!account || !storyElement || !parentStoryElement.ipId) {
      setButtonState((prevState) => ({ ...prevState, [parentName]: 'Mint' }));
      setLoadingState((prevState) => ({ ...prevState, [parentName]: false }));
      return;
    } 

    const config: StoryConfig = {
      account: account,
      transport: custom(window.ethereum),
      chainId: 'sepolia',
    }

    const client = StoryClient.newClient(config)

    console.log(`Mint license tokens for ${storyElement.name} from parent ipId: ${parentStoryElement.ipId}.`);

    const mintLicenseResponse = await client.license.mintLicenseTokens({
      licenseTermsId: selectedLicense,
      licensorIpId: parentStoryElement.ipId!,
      receiver: account,
      amount: 1,
      txOptions: { waitForTransaction: true },
    })

    if (mintLicenseResponse && mintLicenseResponse.licenseTokenIds) {
      const response = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: storyElement.id, licenseTokenId: mintLicenseResponse.licenseTokenIds[0].toString(), state: "LicenseTokensMinted" })
      });

      setButtonState((prevState) => ({ ...prevState, [parentName]: 'Register as Derivative' }));
    } else {
      console.log(`Mint license tokens for ${storyElement.name} failed.`);
      setButtonState((prevState) => ({ ...prevState, [parentName]: 'Mint' }));
    }
    setLoadingState((prevState) => ({ ...prevState, [parentName]: false }));
  };

  const registerDerivativeWithLicenseTokens = async (parentName: string, childName: string) => {
    setLoadingState((prevState) => ({ ...prevState, [parentName]: true }));
    setButtonState((prevState) => ({ ...prevState, [parentName]: 'Please wait...' }));

    const parentStoryElement = await fetchData(parentName);
    setStoryElement(await fetchData(childName));

    if (!parentStoryElement || !storyElement) {
      return;
    }

    const account: Address = await connectMetaMask();

    if (!account || !storyElement) return;

    const config: StoryConfig = {
      account: account,
      transport: custom(window.ethereum),
      chainId: 'sepolia',
    }

    const client = StoryClient.newClient(config)

    const registeredDerivativeIpAssetResponse = await client.ipAsset.registerDerivativeWithLicenseTokens({
      childIpId: storyElement.ipId!,
      licenseTokenIds: [storyElement.licenseTokenId!],
      txOptions: { waitForTransaction: true },
    })

    if (registeredDerivativeIpAssetResponse) {
      const response = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: storyElement.id, state: "RegisteredAsDerivative", derivativeRegistration: parentStoryElement.name })
      });

      setButtonState((prevState) => ({ ...prevState, [parentName]: 'Registered as Derivative' }));
    } else {
      setButtonState((prevState) => ({ ...prevState, [parentName]: 'Register as Derivative' }));
    }
    setLoadingState((prevState) => ({ ...prevState, [parentName]: false }));
  };

  const updateChildData = (childName: string, updatedData: Partial<ChildData>) => {
    setStoryElement(prevState => {
      if (!prevState) return null;
      
      return {
        ...prevState,
        childrenData: prevState?.childrenData?.map(child =>
          child.childName === childName ? { ...child, ...updatedData } : child
        )
      };
    });
  };

  const collectRoyaltyTokens = async (childName: string, childIpId: string) => {
    try {
      const account = await connectMetaMask();

      if (!account || !storyElement) return;

      const config: StoryConfig = {
        account: account,
        transport: custom(window.ethereum),
        chainId: 'sepolia',
      };

      const client = StoryClient.newClient(config);

      console.info(`Collecting royalty tokens for ${storyElement.ipId} from royalty vault ${childIpId}.`);

      const response = await client.royalty.collectRoyaltyTokens({
        parentIpId: storyElement.ipId as Address,
        royaltyVaultIpId: childIpId as Address,
        txOptions: { waitForTransaction: true },
      });

      console.info('response:', response);
      console.info('response.royaltyTokensCollected:', response.royaltyTokensCollected);

      if (response && response.royaltyTokensCollected) {
        console.log(`Collected royalty token ${response.royaltyTokensCollected} at transaction hash ${response.txHash}`);

        const updateResponse = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: storyElement.name,
            childrenData: storyElement.childrenData?.map(child =>
              child.childName === childName
                ? { ...child, isRoyaltyTokensCollected: true, royaltyTokensCollected: Number(response.royaltyTokensCollected) }
                : child
            ),
          }),
        });

        if (updateResponse.ok) {
          updateChildData(childName, {
            isRoyaltyTokensCollected: true,
            royaltyTokensCollected: Number(response.royaltyTokensCollected),
          });
        } else {
          console.error('Failed to update story element:', updateResponse.statusText);
        }
      } else {
        console.error('Failed to collect royalty tokens. response was null');
      }
    } catch (error) {
      console.error('Failed to collect royalty tokens:', error);
    }
  };

  const claimRevenue = async (childIpId: string, snapshotIds: string[], childName: string) => {
    try {
      const account = await connectMetaMask();
  
      if (!account || !storyElement) return;
  
      const config: StoryConfig = {
        account: account,
        transport: custom(window.ethereum),
        chainId: 'sepolia',
      };
  
      const client = StoryClient.newClient(config);
  
      console.info(`Claiming revenue for ${storyElement.ipId} from royalty vault ${childIpId}.`);
  
      const snapshotResponse = await client.royalty.snapshot({
        royaltyVaultIpId: childIpId as Address,
        txOptions: { waitForTransaction: true },
      });
  
      if (snapshotResponse && snapshotResponse.snapshotId) {
        console.log(`Took a snapshot with id ${snapshotResponse.snapshotId} at transaction hash ${snapshotResponse.txHash}`);
  
        const updateResponse = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: storyElement.name,
            childrenData: storyElement.childrenData?.map(child =>
              child.childName === childName
                ? { ...child, snapshotId: snapshotResponse.snapshotId?.toString() ?? '' }
                : child
            ),
          }),
        });
  
        if (updateResponse.ok) {
          updateChildData(childName, {
            snapshotId: snapshotResponse.snapshotId.toString(),
          });
        } else {
          console.error('Failed to update story element:', updateResponse.statusText);
        }
      }
  
      const response = await client.royalty.claimRevenue({
        snapshotIds: snapshotIds,
        royaltyVaultIpId: childIpId as Address,
        token: CurrencyAddress,
        txOptions: { waitForTransaction: true },
      });
  
      if (response && response.claimableToken) {
        console.log(`Claimed revenue token ${response.claimableToken} at transaction hash ${response.txHash}`);
  
        const claimableTokenStr = response.claimableToken.toString();
  
        const updatedChildrenData = storyElement.childrenData?.map(child =>
          child.childName === childName
            ? { ...child, revenueTokensClaimed: (child.revenueTokensClaimed || 0) + Number(claimableTokenStr) }
            : child
        );
  
        const updateResponse = await fetch(`/api/storyelements/${encodeURI(storyElement.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: storyElement.name,
            childrenData: updatedChildrenData,
          }),
        });
  
        if (updateResponse.ok) {
          const updatedChild = updatedChildrenData?.find(child => child.childName === childName);
          updateChildData(childName, {
            revenueTokensClaimed: updatedChild?.revenueTokensClaimed,
          });
        } else {
          console.error('Failed to update story element:', updateResponse.statusText);
        }
      }
    } catch (error) {
      console.error('Failed to claim revenue:', error);
    }
  };
  
  const parentsAttribute = storyElement.attributes?.find((attr) => attr.trait_type === 'Parents');
  const parentLinks = parentsAttribute?.value.split(', ').map((parent: string) => (
    <span key={parent} className="mr-2 inline-block">
      <Link href={`/muertos/storyelements/${parent}`} className="text-blue-500 hover:underline">
        {parent}
      </Link>
      <button
        className={`ml-1 p-1 bg-gray-400 cursor-not-allowed text-xs rounded relative ${
          buttonState[parent] === 'Registered as Derivative' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 text-white'
        }`}
        onClick={() => buttonState[parent] === 'Register as Derivative' ? registerDerivativeWithLicenseTokens(parent, storyElement.name) : mintLicenseTokens(parent, storyElement.name)}
        onMouseEnter={() => setHovered(parent)}
        onMouseLeave={() => setHovered(null)}
//        disabled={buttonState[parent] === 'Registered as Derivative' || loadingState[parent]}
        disabled={true}
      >
        {buttonState[parent] === 'Registered as Derivative' ? 'Registered as Derivative' : buttonState[parent] === 'Register as Derivative' ? 'Register as Derivative' : buttonState[parent] === 'Please wait...' ? 'Please wait...' : 'Mint'}
        {hovered === parent && (
          <span className="absolute bg-black text-white text-xs rounded p-1 mt-1 ml-2">
            {buttonState[parent] === 'Registered as Derivative' ? 'Registered as derivative' : buttonState[parent] === 'Register as Derivative' ? 'Register as derivative' : 'Mint license tokens'}
          </span>
        )}
      </button>
    </span>
  ));

  const handleLicenseChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setSelectedLicense(event.target.value);
  };

  const handleAttachLicenseTerms = () => {
    const licenseName = selectedLicense === "1" ? "Commercial" : "Non-commercial";
    attachLicenseTerms(storyElement.name, selectedLicense, licenseName);
  };

  const childrenLinks = storyElement.childrenData?.map((child) => (
    <li key={child.childName} className="flex items-center space-x-2 mt-2">
      <Link href={`/storyelement/${child.childName}`} className="text-blue-500 hover:underline">
        {child.childName}
      </Link>
      <button
        className={`p-1 text-xs rounded hover:bg-blue-700 shadow-lg transition duration-300 ${
          child.isRoyaltyTokensCollected ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'
        }`}
        onClick={() => collectRoyaltyTokens(child.childName, child.ipId!)}
//        disabled={child.isRoyaltyTokensCollected || !child.ipId}
        disabled={true}
        >
        {child.isRoyaltyTokensCollected ? 'Royalty tokens collected' : 'Collect Royalty Tokens'}
      </button>
      {child.royaltyTokensCollected !== undefined && (
        <span className="text-xs text-gray-400 ml-2">
          Collected: {child.royaltyTokensCollected}
        </span>
      )}
      <button
        className={`p-1 text-xs rounded hover:bg-blue-700 shadow-lg transition duration-300 ${storyElement.licenseTermsId && child.ipId ? 'bg-blue-500 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
        onClick={() => claimRevenue(child.ipId!, [child.snapshotId!], child.childName)}
//        disabled={!storyElement.licenseTermsId || !child.ipId}
        disabled={true}
>
        Claim Revenue
      </button>
      {child.revenueTokensClaimed !== undefined && (
        <span className="text-xs text-gray-400 ml-2">
          Revenue Claimed: {child.revenueTokensClaimed}
        </span>
      )}
    </li>
  ));
  
  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <li className="relative sm:pr-4 sm:after:content-[''] sm:after:block sm:after:absolute sm:after:top-0 sm:after:right-0 sm:after:h-full sm:after:w-px sm:after:bg-gray-400">
          <Link href="/muertos" className="text-white hover:text-gray-300">
            Home
          </Link>
        </li>
        <li>
          <Link href="/muertos/storyelements/create" className="text-white hover:text-gray-300">
            Story Elements
          </Link>
        </li>
      </ul>
    </nav>
  );
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-gray-900 text-white">
      {renderNavigation()}
      <h1 className="text-4xl font-bold mb-6">Story Element Details</h1>
      <div key={storyElement.id} className="border rounded p-6 bg-gray-800 flex flex-col md:flex-row items-start">
        {storyElement && storyElement.image ? (
          <img
            src={getImageUrl(storyElement.image)}
            alt={storyElement.name}
            className="w-64 h-64 object-cover rounded mb-4 md:mb-0 md:mr-4"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-gray-700 text-gray-400 rounded mb-4 md:mb-0 md:mr-4">
            No Image Available
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-2xl font-semibold mb-2">{storyElement.name}</h3>
          <p className="mb-2">ID: {storyElement.id}</p>
          <p className="mb-4">{storyElement.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Text')?.value || 'No text available'}</p>
          <p className="mb-4">Aspect: {storyElement.attributes?.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect')?.value || 'No text available'}</p>
          <p className="mb-4">
            <strong>Parents: </strong>
            {parentLinks && parentLinks.length > 0 ? parentLinks : 'No parents'}
          </p>
          <div className="mb-4">
            {storyElement.isRegistered ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <p className="p-2 bg-green-500 text-white rounded">Registered as IP Asset</p>
                <p className="p-2 bg-gray-800 text-white rounded">
                  IP ID: {storyElement.ipId?.substring(0, 9)}...
                </p>
                {!storyElement.licenseTermsId ? (
                  <>
                    <select 
                      value={selectedLicense} 
                      onChange={handleLicenseChange} 
                      className="select-dropdown p-2 rounded bg-gray-700 text-white focus:bg-gray-600 focus:text-white"
                    >
                      <option value="2">Non-commercial</option>
                      <option value="1">Commercial</option>
                    </select>
                    <button
                      className="p-2 bg-blue-500 text-white rounded"
                      onClick={handleAttachLicenseTerms}
                    >
                      Attach License Terms
                    </button>
                  </>
                ) : (
                  <p className="p-2 bg-green-500 text-white rounded">License ID: {storyElement.licenseTermsId}</p>
                )}
              </div>
            ) : (
              <p>
                <button
                  onClick={() => handleRegister(storyElement.name)}
                  className="mt-4 p-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-300 disabled"
//                  disabled={loading}
                  disabled={true}
                >
                  {loading ? 'Please wait...' : 'Register IP Asset'}
                </button>
              </p>
            )}
          </div>
          <div className="mb-4">
            <strong>Children: </strong>
            {storyElement.childrenData && storyElement.childrenData.length > 0 ? (
              <ul>
                {childrenLinks}
              </ul>
            ) : (
              <p>No registered children found for this story element.</p>
            )}
            </div>
          <div className="mb-4">
            <strong>Craftings based on this StoryElement: </strong>
            {craftings.length > 0 ? (
              <div>
                <ul>
                  {craftings.map((crafting) => (
                    <li key={crafting.id}>
                      <Link href={`/crafting/${crafting.id}`} className="text-blue-500 hover:underline mt-4 block">
                        {crafting.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/crafting/create" 
                  className="mt-4 p-2 bg-blue-500 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-300 inline-block disabled"
                  onClick={(e) => e.preventDefault()}
                >
                  Create Crafting
              </Link>
              </div>
            ) : (
              <div>
                <p>No craftings found for this story element.</p>
                <Link href="/crafting/create"
                  className="mt-4 p-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-300 mt-2 p-2 bg-blue-500 text-white rounded inline-block disabled"
                  onClick={(e) => e.preventDefault()}
                >
                  Create Crafting
                </Link>
              </div>
            )}
          </div>
          <Link href="/storyelements/loadall" className="text-white disabled"
                onClick={(e) => e.preventDefault()}
                >
            Back to all Story Elements
          </Link>
        </div>
      </div>
    </main>
  );
};

export default StoryElementDetail;
