import { NextRequest, NextResponse } from 'next/server';
import { AlchemyApiKey, AlchemyBaseNftUrl, NFTContractAddress } from '../../../utils/utils';
import { Network, Alchemy } from 'alchemy-sdk';
import axios from 'axios';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const contractAddress = searchParams.get('contractAddress') || NFTContractAddress;

    if (!wallet || !contractAddress) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.info(`contractAddress: ${contractAddress} wallet: ${wallet}`)

    const settings = {
        apiKey: AlchemyApiKey,
        network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(settings);

    try {
        const axiosResponse = await axios.get(
            `${AlchemyBaseNftUrl}/${AlchemyApiKey}/isHolderOfContract`,
            {
                params: {
                    wallet: wallet,
                    contractAddress: contractAddress,
                },
                headers: {
                    accept: 'application/json',
                },
            }
        );

        const isHolderOfContract = axiosResponse.data.isHolderOfContract;
        console.info('isHolderOfContract:', isHolderOfContract);

        const nftsForOwner = await alchemy.nft.getNftsForOwner(wallet);

        const filteredNfts = nftsForOwner.ownedNfts.filter(
            (ownedNft) => ownedNft.contract.address.toLowerCase() === contractAddress.toLowerCase()
        );

        return NextResponse.json({ isHolderOfContract, nfts: filteredNfts });
    } catch (error) {
        console.error('Error fetching contract holder information or NFTs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
