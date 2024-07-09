import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Prose } from '../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);

  try {
    const collection = await getCollection('prose');

    let prose = await collection.find({}).toArray();
    
    return NextResponse.json(prose);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  try {
    const prose: Prose = await request.json();

    const collection = await getCollection('prose');

    const result = await collection.findOneAndUpdate(
      { tokenId: prose.tokenId },
      { $set: prose },
      { upsert: true, returnDocument: 'after' }
    );

    if (result && result.ok) {
      return NextResponse.json({ info: 'Prose saved successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ result: `${result}` }, { status: 200 });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
