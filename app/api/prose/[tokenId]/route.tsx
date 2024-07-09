import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { Prose } from '../../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const tokenId = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!tokenId || typeof tokenId !== 'string') {
    return NextResponse.json({ error: 'Invalid tokenId format' }, { status: 400 });
  }

  const tokenIdNumber = Number(tokenId);

  if (isNaN(tokenIdNumber)) {
    return NextResponse.json({ error: 'Invalid tokenId' }, { status: 400 });
  }

  try {
    const collection = await getCollection('prose');

    console.info('GET /api/prose/', tokenId);
    let prose: Prose | null = await collection.findOne<Prose>({ tokenId: tokenIdNumber });
    return NextResponse.json(prose);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
