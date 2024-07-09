import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const id = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('craftings');
    const crafting = await collection.findOne({ id: parseInt(id) });

    if (!crafting) {
      return NextResponse.json({ error: 'Crafting not found' }, { status: 404 });
    }

    return NextResponse.json(crafting);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  let { id, aiText } = await request.json();
  const craftingName = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!craftingName || typeof craftingName !== 'string') {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('craftings');
    const crafting = await collection.findOne({ name: craftingName });

    if (!crafting) {
      return NextResponse.json({ error: 'Crafting not found' }, { status: 404 });
    }

    const result = await collection.updateOne(
      { id: parseInt(id) },
      { $set: { aiText } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Crafting not found while updating' }, { status: 404 });
    }

    return NextResponse.json({ info: 'Crafting updated successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
