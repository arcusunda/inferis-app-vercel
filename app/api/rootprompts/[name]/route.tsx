import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../utils/mongodb';
import { Collection, Document } from 'mongodb';

export const maxDuration = 60;

export interface RootPrompt {
  id: number;
  name: string;
  promptText: string;
  created: Date;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const promptName = searchParams.get('promptName');

  if (!promptName || typeof promptName !== 'string') {
    return NextResponse.json({ error: 'Invalid promptName format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('rootPrompts');
    let rootPrompt: RootPrompt | null = await collection.findOne<RootPrompt>({ name: promptName });

    if (!rootPrompt) {
      console.info(`No rootPrompt found with name: ${promptName}. Creating a new one.`);
      rootPrompt = {
        id: await getNextPromptId(collection),
        name: promptName,
        promptText: 'Default prompt text',
        created: new Date(),
      };

      await collection.insertOne(rootPrompt);
    }

    return NextResponse.json(rootPrompt);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

async function getNextPromptId(collection: Collection<Document>) {
  const maxPrompt = await collection.find().sort({ id: -1 }).limit(1).toArray();
  const nextId = maxPrompt.length > 0 ? maxPrompt[0].id + 1 : 1;
  return nextId;
}
