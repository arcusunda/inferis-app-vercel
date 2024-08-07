import { NextRequest, NextResponse } from 'next/server';
import { AlchemyApiKey, NFTBaseContractAddress, NFTStakingContractAddress, BaseNFTMetadata } from '../../../../utils/utils';
import { ethers } from 'ethers';
import axios from 'axios';

export const maxDuration = 60;

const stakingContractABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "owner_",
        "type": "address"
      }
    ],
    "name": "walletOfOwner",
    "outputs": [
      {
        "components": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "stakedAt",
            "type": "uint256"
          },
          {
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

const mainNFTContractABI = [{
  "inputs": [
    {
      "internalType": "address",
      "name": "_owner",
      "type": "address"
    }
  ],
  "name": "walletOfOwner",
  "outputs": [
    {
      "internalType": "uint256[]",
      "name": "",
      "type": "uint256[]"
    }
  ],
  "payable": false,
  "stateMutability": "view",
  "type": "function"
}
];

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
//    const staked = searchParams.get('staked') === 'true';

    // ignoring staked boolean for now

    if (!wallet) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${AlchemyApiKey}`);

        const stakingContract = new ethers.Contract(NFTStakingContractAddress, stakingContractABI, provider);

        console.info(`contractAddress: ${NFTStakingContractAddress}, contractABI: ${stakingContractABI}`)
        const stakedNfts = await stakingContract.walletOfOwner(wallet);

        const contract = new ethers.Contract(NFTBaseContractAddress, mainNFTContractABI, provider);

        console.info(`contractAddress: ${NFTBaseContractAddress}, contractABI: ${mainNFTContractABI}`)
        const nfts = await contract.walletOfOwner(wallet);

//        console.info('NFTs:', nfts);

        const nftMetadata = await Promise.all(stakedNfts.map(async (stakedNft: [string, bigint, bigint] | bigint) => {
          let tokenIdString: string;
          const [owner, stakedAt, tokenId] = stakedNft as [string, bigint, bigint];
          if (tokenId === undefined || tokenId === null) {
            console.error('Token ID is undefined or null for:', stakedNft);
            return { error: 'Token ID is undefined or null', stakedNft };
          }
          tokenIdString = tokenId.toString();


          try {
            const response = await axios.get(`https://ipfs.io/ipfs/${BaseNFTMetadata}/${tokenIdString}.json`);
            return { tokenId: tokenIdString, ...response.data };
          } catch (error) {
            console.error('Error fetching metadata for tokenId:', tokenIdString, error);
            return { tokenId: tokenIdString, error: 'Error fetching metadata' };
          }
        }));

        const stakedNftMetadata = await Promise.all(nfts.map(async (nft: [string, bigint, bigint] | bigint) => {
          let tokenIdString: string;
          tokenIdString = (nft as bigint).toString();

          try {
            const response = await axios.get(`https://ipfs.io/ipfs/${BaseNFTMetadata}/${tokenIdString}.json`);
            console.info('Processed tokenId:', tokenIdString);
            return { tokenId: tokenIdString, ...response.data };
          } catch (error) {
            console.error('Error fetching metadata for tokenId:', tokenIdString, error);
            return { tokenId: tokenIdString, error: 'Error fetching metadata' };
          }
        }));

        const combinedMetadata = [...nftMetadata, ...stakedNftMetadata];

        return NextResponse.json({ nfts: combinedMetadata });
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
