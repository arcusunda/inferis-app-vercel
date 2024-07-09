import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../utils/mongodb';
import { OpenAiModel } from '../../../utils/utils';
import OpenAI from 'openai';

const openai = new OpenAI();
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { promptText, storyElements } = await request.json();

  try {
    const storyElementNames = storyElements.split(',').map((name: string) => name.trim());
    const collection = await getCollection('storyElements');
    const storyElementsData = await collection.find({ name: { $in: storyElementNames } }).toArray();
    const storyText = storyElementsData.map(element => element.text).join('\n');
    const finalPromptText = `${storyText}\n${promptText}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: finalPromptText }],
      model: OpenAiModel,
    });

    const aiText = completion.choices[0].message.content;
    return NextResponse.json({ aiText });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
