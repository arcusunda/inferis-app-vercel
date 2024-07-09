import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { Character } from '../../../types';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const tokenIdString = pathname.split('/').pop()?.replaceAll('%20', ' ').replaceAll('%23', '#');

  if (!tokenIdString || typeof tokenIdString !== 'string') {
    return NextResponse.json({ error: 'Invalid tokenId format' }, { status: 400 });
  }

  const tokenId = parseInt(tokenIdString, 10);

  if (isNaN(tokenId)) {
    return NextResponse.json({ error: 'Invalid tokenId format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('characters');

    console.info('GET /api/characters/[tokenId]', tokenId);
    let character: Character | null = await collection.findOne<Character>({ tokenId: tokenId });
    return NextResponse.json(character);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
