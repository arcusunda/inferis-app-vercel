import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../utils/mongodb';
import { OpenAiModel } from '../../../../utils/utils';
import OpenAI from 'openai';

const openai = new OpenAI();
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { promptText, newStoryElement } = await request.json();

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: promptText }],
      model: OpenAiModel,
    });

    const aiText = completion.choices[0].message.content;

    return NextResponse.json({ aiText });
  } catch (error) {
    console.error('Error calling OpenAI API or saving to MongoDB:', error);
    return NextResponse.json({ error: 'Failed to fetch AI response or save Story Element' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function GET(request: NextRequest) {
  try {
    const collection = await getCollection('rootStoryElements');
    const rootStoryElements = await collection.find({}).toArray();
    return NextResponse.json(rootStoryElements);
  } catch (error) {
    console.error('Error fetching root story elements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
