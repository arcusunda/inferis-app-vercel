import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../utils/mongodb';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { voterAddress, tokenId, storyElementName, vote, comment } = await request.json();

  console.info(`Received vote: ${voterAddress} voted ${vote} for ${storyElementName} on ${tokenId} with comment: ${comment}`)
    if (!voterAddress || !tokenId || !storyElementName || !vote) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

  try {
    const collection = await getCollection('votes');
    await collection.insertOne({
        voterAddress,
        tokenId,
        storyElementName,
        vote,
        comment,
        timestamp: new Date(),
      });

      const likeCount = await collection.countDocuments({
        tokenId,
        storyElementName,
        vote: 'Yes',
      });

    
    return NextResponse.json({ likes: likeCount });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
