import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { StoryIdea } from '../../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const tokenId = pathname;

  if (!tokenId || typeof tokenId !== 'string') {
    return NextResponse.json({ error: 'Invalid tokenId format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('storyIdeas');

    console.info('GET /api/storyideas/', tokenId);
    let storyIdea: StoryIdea | null = await collection.findOne<StoryIdea>({ tokenId: tokenId });
    return NextResponse.json(storyIdea);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
