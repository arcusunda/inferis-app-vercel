import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../../utils/mongodb';
import { assistantId, vectorStoreId } from '../../../../../utils/utils';
import OpenAI from 'openai';

const openai = new OpenAI();
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    const { promptText, storyElementIds, tropeIds: tropeIds } = await request.json();

  try {
    const storyElementIdentifiers = storyElementIds.split(',').map((id: string) => parseInt(id.trim(), 10));
    const selectedTropesIdentifiers = tropeIds.split(',').map((id: string) => parseInt(id.trim(), 10));

    const collection = await getCollection('storyElements');
    const selectedTropesData = await collection.find({ id: { $in: selectedTropesIdentifiers } }).toArray();
    const allTropeDescriptions = 
    selectedTropesData.map(trope => 
      trope.attributes.find((attr: { trait_type: string; }) => attr.trait_type === 'Aspect').value + ": " + trope.name + ": " + 
      trope.attributes.find((attr: { trait_type: string; }) => attr.trait_type === 'Text').value).join(', ');

    const storyElementsData = await collection.find({ id: { $in: storyElementIdentifiers } }).toArray();
    const storyText = storyElementsData.map(element => {
        const textAttribute = element.attributes.find((attr: { trait_type: string; }) => attr.trait_type === 'Text');
        return textAttribute ? textAttribute.value : '';
      }).join('\n');
      
    const finalPromptText = `${promptText}\n${storyText}.\n Story idea tropes: ${allTropeDescriptions}`;

    console.info('finalPromptText:', finalPromptText);

    const assistant = await openai.beta.assistants.retrieve(assistantId);
  
    const thread = await openai.beta.threads.create({
      messages: [ { role: "user", content: finalPromptText} ],
      tool_resources: {
        "file_search": {
          "vector_store_ids": [vectorStoreId]
        }
      }
    });

    let run = await openai.beta.threads.runs.createAndPoll(
      thread.id,
      { 
        assistant_id: assistant.id
      }
    );

    let aiText = '';
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(
        run.thread_id
      );
      for (const message of messages.data.reverse()) {
        aiText = message.content[0].type === 'text' ? message.content[0].text.value : 'No response from AI';
      }
    } else {
      console.log(run.status);
    }
    return NextResponse.json({ aiText });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
