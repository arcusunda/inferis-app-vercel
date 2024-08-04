import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../../utils/mongodb';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const aspect = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!aspect || typeof aspect !== 'string') {
    return NextResponse.json({ error: 'Invalid aspect format' }, { status: 400 });
  }

  const validAspects = ['Muerto Body', 'Muerto Mask', 'Muerto Headwear', 'Muerto Expression'];
  if (!validAspects.includes(aspect)) {
    return NextResponse.json({ error: 'Invalid aspect value' }, { status: 400 });
  }

  try {
    const collection = await getCollection('storyElements');

    const count = await collection.countDocuments({ 'attributes.trait_type': 'Aspect', 'attributes.value': aspect });
    console.info(`Counted ${count} story elements with aspect ${aspect}`);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
