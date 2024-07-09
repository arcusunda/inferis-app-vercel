import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const collection = await getCollection('craftings');
    const lastCrafting = await collection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = lastCrafting.length > 0 ? lastCrafting[0].id + 1 : 1;

    return NextResponse.json({ nextId });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
