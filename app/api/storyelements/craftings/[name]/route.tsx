import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../../../utils/mongodb';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const name = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('craftings');

    const craftings = await collection.find({
      "attributes": {
        $elemMatch: {
          "trait_type": "Story Elements",
          "value": { $regex: new RegExp(`(^|,\\s*)${name}(,\\s*|$)`) }
        }
      }
    }).toArray();
    
    return NextResponse.json(craftings);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
