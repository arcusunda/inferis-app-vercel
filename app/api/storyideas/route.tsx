import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { StoryIdea } from '../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);

  try {
    const collection = await getCollection('storyIdeas');

    let storyIdeas = await collection.find({}).toArray();
    
    return NextResponse.json(storyIdeas);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  try {
    const storyIdea: StoryIdea = await request.json();

    const collection = await getCollection('storyIdeas');

    const result = await collection.findOneAndUpdate(
      { tokenId: storyIdea.tokenId },
      { $set: storyIdea },
      { upsert: true, returnDocument: 'after' }
    );

    console.info('POST /api/storyideas', storyIdea.text, result);
    if (result && result.ok) {
      return NextResponse.json({ info: 'StoryIdea saved successfully' }, { status: 200 });
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
