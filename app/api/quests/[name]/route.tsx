import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { Quest } from '../../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const questName = pathname.split('/').pop()?.replaceAll('%20', ' ').replaceAll('%23', '#');

  if (!questName || typeof questName !== 'string') {
    return NextResponse.json({ error: 'Invalid questName format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('quests');

    console.info('GET /api/quests/', questName);
    let quest: Quest | null = await collection.findOne<Quest>({ name: questName });
    console.info('quest:', quest);
    return NextResponse.json(quest);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
