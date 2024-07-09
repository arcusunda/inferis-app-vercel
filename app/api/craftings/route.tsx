import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const crafting = await request.json();

  try {
    const collection = await getCollection('craftings');
    const result = await collection.insertOne(crafting);

    if (result.acknowledged) {
      return NextResponse.json({ info: 'Crafting created successfully' }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Failed to create crafting' }, { status: 500 });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  } 
}
