import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { StoryIdea } from '../../types';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);

  try {
    const collection = await getCollection('storyScenes');

    let storyScenes = await collection.find({}).toArray();
    
    return NextResponse.json(storyScenes);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  try {
    const storyScene: StoryIdea = await request.json();
    storyScene.tokenId = Number(storyScene.tokenId); // Ensure tokenId is a number

    const collection = await getCollection('storyScenes');
    const historyCollection = await getCollection('storyScenesHistory');

    const existingStoryIdea = await collection.findOne({ tokenId: storyScene.tokenId });

    storyScene.updated = new Date();

    if (existingStoryIdea) {
      storyScene.created = existingStoryIdea.created;

      // Find the maximum version from the history collection
      const maxVersionDocument = await collection.find({ tokenId: storyScene.tokenId }).sort({ version: -1 }).limit(1).toArray();
      const newVersion = maxVersionDocument.length > 0 ? maxVersionDocument[0].version + 1 : 2; // Initialize to 2 if no documents found, as version 1 is the new one

      // Insert current version of the story idea to history collection
      const { _id, ...historyStoryIdea } = existingStoryIdea; // Remove the _id field
      await historyCollection.insertOne(historyStoryIdea);

      storyScene.version = newVersion;

      const result = await collection.updateOne({ tokenId: storyScene.tokenId }, { $set: storyScene });

      if (result && result.acknowledged) {
        return NextResponse.json({ info: 'StoryScene updated successfully' }, { status: 200 });
      } else {
        return NextResponse.json({ result: `${result}` }, { status: 200 });
      }
    } else {
      storyScene.created = new Date();
      storyScene.version = 1;

      const result = await collection.insertOne(storyScene);

      if (result && result.acknowledged) {
        return NextResponse.json({ info: 'StoryScene created successfully' }, { status: 200 });
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
