import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../utils/mongodb';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { voterAddress, tokenId, vote, comment } = await request.json();

  console.info(`Received vote: ${voterAddress} voted ${vote} for ${tokenId} with comment: ${comment}`);
  if (!voterAddress || !tokenId || !vote) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const tokenIdNumber = Number(tokenId);

  if (isNaN(tokenIdNumber)) {
    return NextResponse.json({ error: 'Invalid tokenId' }, { status: 400 });
  }

  try {
    const collection = await getCollection('storyIdeaVotes');
    await collection.insertOne({
      voterAddress,
      tokenId: tokenIdNumber,
      vote,
      comment,
      timestamp: new Date(),
    });

    const yesCount = await collection.countDocuments({
      tokenId: tokenIdNumber,
      vote: 'Yes',
    });

    const noCount = await collection.countDocuments({
      tokenId: tokenIdNumber,
      vote: 'No',
    });

    return NextResponse.json({ yesVotes: yesCount, noVotes: noCount });
  } catch (error) {
    console.error('Error calling vote API:', error);
    return NextResponse.json({ error: 'Failed to fetch vote response' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
