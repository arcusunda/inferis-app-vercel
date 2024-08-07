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
    storyIdea.tokenId = Number(storyIdea.tokenId); // Ensure tokenId is a number

    const collection = await getCollection('storyIdeas');
    const historyCollection = await getCollection('storyIdeaHistory');

    const existingStoryIdea = await collection.findOne({ tokenId: storyIdea.tokenId });

    storyIdea.updated = new Date();

    if (existingStoryIdea) {
      storyIdea.created = existingStoryIdea.created;

      // Find the maximum version from the history collection
      const maxVersionDocument = await collection.find({ tokenId: storyIdea.tokenId }).sort({ version: -1 }).limit(1).toArray();
      const newVersion = maxVersionDocument.length > 0 ? maxVersionDocument[0].version + 1 : 2; // Initialize to 2 if no documents found, as version 1 is the new one

      // Insert current version of the story idea to history collection
      const { _id, ...historyStoryIdea } = existingStoryIdea; // Remove the _id field
      await historyCollection.insertOne(historyStoryIdea);

      storyIdea.version = newVersion;

      const result = await collection.updateOne({ tokenId: storyIdea.tokenId }, { $set: storyIdea });

      if (result && result.acknowledged) {
        return NextResponse.json({ info: 'StoryIdea updated successfully' }, { status: 200 });
      } else {
        return NextResponse.json({ result: `${result}` }, { status: 200 });
      }
    } else {
      storyIdea.created = new Date();
      storyIdea.version = 1;

      const result = await collection.insertOne(storyIdea);

      if (result && result.acknowledged) {
        return NextResponse.json({ info: 'StoryIdea created successfully' }, { status: 200 });
      } else {
        return NextResponse.json({ result: `${result}` }, { status: 200 });
      }
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
