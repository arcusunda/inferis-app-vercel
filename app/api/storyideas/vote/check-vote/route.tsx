import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../../utils/mongodb';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { voterAddress, tokenId } = await request.json();

  const tokenIdNumber = Number(tokenId);

  if (isNaN(tokenIdNumber)) {
    return NextResponse.json({ error: 'Invalid tokenId' }, { status: 400 });
  }

  console.info(`Checking for vote: ${voterAddress} for ${tokenId}`);

  try {
    const collection = await getCollection('storyIdeaVotes');

    let userVote = null;
    if (voterAddress) {
      userVote = await collection.findOne({
        voterAddress,
        tokenId: tokenIdNumber,
      });
      console.info(`User vote by ${voterAddress} for ${tokenId}: ${userVote}`);
    }

    const yesCount = await collection.countDocuments({
      tokenId: tokenIdNumber,
      vote: 'Yes',
    });

    const noCount = await collection.countDocuments({
      tokenId: tokenIdNumber,
      vote: 'No',
    });

    return NextResponse.json({
      yesVotes: yesCount,
      noVotes: noCount,
      userVote: userVote ? userVote.vote : null,
    });
  } catch (error) {
    console.error('Error calling vote API:', error);
    return NextResponse.json({ error: 'Failed to fetch vote response' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
