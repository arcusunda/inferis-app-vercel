import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { Character } from '../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const questName = pathname.split('/').pop()?.replaceAll('%20', ' ').replaceAll('%23', '#');

  try {
    const collection = await getCollection('quests');
    console.info('GET /api/quests all');
    let quests = await collection.find({}).toArray();
    
    return NextResponse.json(quests);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
