import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../../utils/mongodb';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { voterAddress, tokenId, storyElementName } = await request.json();

  console.info(`Checking for vote: ${voterAddress} for ${storyElementName} on ${tokenId}}`)
    if (!storyElementName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

  try {
    const collection = await getCollection('votes');

    let voteCount;
    if(voterAddress) {
      voteCount = await collection.countDocuments({
        voterAddress,
        tokenId,
        storyElementName
      });
      console.info(`Vote count by ${voterAddress} for ${storyElementName} on ${tokenId}: ${voteCount}`);
    } else {
      voteCount = await collection.countDocuments({
        storyElementName
      });
      console.info(`Vote count for ${storyElementName} on ${tokenId}: ${voteCount}`);
    }

    return NextResponse.json({ likes: voteCount });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
