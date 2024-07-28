import { privateKeyToAccount, Address, Account } from 'viem/accounts'


// This is a preset PIL policy: https://docs.storyprotocol.xyz/docs/preset-pil-policies
export const CommercialSocialRemixingTermsId = '1'
export const NonCommercialSocialRemixingTermsId = '2'

export const NFTContractAddress: Address = (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as Address) || 'Unnamed'

export const WBNFTContractAddress: Address = (process.env.NEXT_PUBLIC_WB_NFT_CONTRACT_ADDRESS as Address) || 'Unnamed'

export const NFTStakingContractAddress: Address = (process.env.NEXT_PUBLIC_BASE_STAKING_CONTRACT_ADDRESS as Address) || 'Unnamed'

export const NFTBaseContractAddress: Address = (process.env.NEXT_PUBLIC_BASE_NFT_CONTRACT_ADDRESS as Address) || 'Unnamed'

export const BaseNFTMetadata: Address = (process.env.NEXT_PUBLIC_BASE_NFT_METADATA as Address) || 'Unnamed'

export const NftContractName = process.env.NEXT_PUBLIC_NFT_CONTRACT_NAME || 'Unnamed'

export const StoryProtocolApiBaseUri = process.env.NEXT_PUBLIC_SP_API_BASE_URI || 'Unnamed'

export const StoryProtocolApiChain = process.env.NEXT_PUBLIC_SP_API_CHAIN || 'Unnamed'

export const StoryProtocolApiKey = process.env.NEXT_PUBLIC_SP_API_KEY || 'Unnamed'

export const AlchemyRpcProviderUrl = process.env.ALCHEMY_RPC_PROVIDER_URL || 'Unnamed'

export const AlchemyApiKey = process.env.ALCHEMY_API_KEY || 'Unnamed'

export const AlchemyBaseNftUrl = process.env.ALCHEMY_BASE_NFT_URL || 'Unnamed'

export const IpfsBaseUrl = process.env.NEXT_PUBLIC_IPFS_BASE_URL || 'Unnamed'

// export const EthSepolia = process.env.NEXT_PUBLIC_ETH_NETWORK || 'Unnamed'

export const StoryElementDescription = process.env.NEXT_PUBLIC_STORY_ELEMENT_DESCRIPTION || 'Unnamed'

export const WorldBuildingPassDescription = process.env.NEXT_PUBLIC_WBP_DESCRIPTION || 'Unnamed'

export const BannerImageUrl = process.env.NEXT_PUBLIC_BANNER_IMAGE_URL || 'Unnamed'

export const WorldBaseMintingPage = process.env.NEXT_PUBLIC_WORLD_BASE_MINTING_PAGE || 'Unnamed'

export const WorldBuildingPassMintingPage = process.env.NEXT_PUBLIC_WORLD_BUILDING_PASS_MINTING_PAGE || 'Unnamed'

export const WorldName = process.env.NEXT_PUBLIC_WORLD_NAME || 'Unnamed'

export const WorldSummary = process.env.NEXT_PUBLIC_WORLD_SUMMARY || 'Unnamed'

export const OpenAiModel = process.env.OPENAI_MODEL || 'Unnamed'

export const vectorStoreId = process.env.VECTOR_STORE_ID || 'Unnamed'

export const assistantId = process.env.ASSISTANT_ID || 'Unnamed'

export const CurrencyAddress: Address = (process.env.CURRENCY_ADDRESS as Address) || '0xB132A6B7AE652c974EE1557A3521D53d18F6739f'

export const WalletConnectProjectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'Unnamed'

export const mintContractApi = {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
}

export const formatBalance = (rawBalance: string) => {
    const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(2)
    return balance
  }
  
  export const formatChainAsNum = (chainIdHex: string) => {
    const chainIdNum = parseInt(chainIdHex)
    return chainIdNum
  }
  
  export const formatAddress = (addr: string) => {
    const upperAfterLastTwo = addr.slice(0,2) + addr.slice(2)
    return `${upperAfterLastTwo.substring(0, 5)}...${upperAfterLastTwo.substring(39)}`
  }