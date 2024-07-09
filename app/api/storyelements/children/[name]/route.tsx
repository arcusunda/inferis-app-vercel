import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../../utils/mongodb';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const name = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!name || typeof name !== 'string') {
    console.error('Invalid name format');
    return NextResponse.json({ error: 'Invalid name format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('storyElements');
    const children = await collection.find({ 
        "attributes": {
          $elemMatch: {
            trait_type: "Parents",
            value: { $regex: `.*${name}.*`, $options: 'i' }
          }
        }
      }).toArray();
    if (!children || children.length === 0) {
      return NextResponse.json({ info: 'No children found' }, { status: 200 });
    }

    return NextResponse.json(children);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
