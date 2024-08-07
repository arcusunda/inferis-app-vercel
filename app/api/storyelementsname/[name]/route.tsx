import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const name = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!name || typeof name !== 'string') {
    console.error('Invalid Name format');
    return NextResponse.json({ error: 'Invalid Name format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('storyElements');
    const storyElement = await collection.findOne({ name: name });

    if (!storyElement) {
      return NextResponse.json({ error: 'Story Element not found' }, { status: 404 });
    }

    return NextResponse.json(storyElement);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
