import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { StoryIdea } from '../../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const tokenId = pathname.split('/').pop()?.replaceAll('%20', ' ');

  console.info('GET /api/storyideas/ tokenId: ', tokenId);
  if (!tokenId || typeof tokenId !== 'string') {
    return NextResponse.json({ error: 'Invalid tokenId format' }, { status: 400 });
  }

  const tokenIdNumber = Number(tokenId);

  try {
    const collection = await getCollection('storyIdeas');

    let storyIdea: StoryIdea | null = await collection.findOne<StoryIdea>({ tokenId: tokenIdNumber });
    return NextResponse.json(storyIdea);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
