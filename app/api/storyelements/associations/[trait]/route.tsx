import { getCollection, closeMongoDB } from '../../../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const trait = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!trait || typeof trait !== 'string') {
    console.error('Invalid ID format');
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const storyElementMappingsCollection = await getCollection('storyElementMappings');
    const storyElementMappings = await storyElementMappingsCollection.find({ trait: trait }).toArray();

    if (!storyElementMappings.length) {
      return NextResponse.json({ info: 'Mapping not found' }, { status: 200 });
    }

    const storyElementsCollection = await getCollection('storyElements');

    const storyElementIds = storyElementMappings.map(mapping => mapping.storyElementId);

    const storyElements = await storyElementsCollection.find({ id: { $in: storyElementIds } }).toArray();

    return NextResponse.json(storyElements);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
