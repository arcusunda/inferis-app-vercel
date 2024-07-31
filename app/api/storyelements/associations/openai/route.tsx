import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../../utils/mongodb';
import { assistantId, vectorStoreId } from '../../../../../utils/utils';
import OpenAI from 'openai';

const openai = new OpenAI();
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    const { aiPrompt, storyElementIds, tropeIds, bodyData, maskData, headwearData } = await request.json();

    try {
        const storyElementIdentifiers = storyElementIds.split(',').map((id: string) => parseInt(id.trim(), 10));
        const selectedTropesIdentifiers = tropeIds.split(',').map((id: string) => parseInt(id.trim(), 10));

        const collection = await getCollection('storyElements');

        const selectedTropesData = await collection.find({ id: { $in: selectedTropesIdentifiers } }).toArray();

        let values = {
            mortalAntagonist: '[Mortal Antagonist]',
            magicalCreature: '[Magical Creature]',
            magicalItem: '[Magical Item]',
            crypticClue: '[Cryptic Clue]',
            secretSociety: '[Secret Society]',
            muertoMask: maskData,
            muertoBody: bodyData,
            muertoHeadwear: headwearData
        };

        type TraitType = keyof typeof values;

        const traitMapping: Record<string, TraitType> = {
            'Character - Mortal Antagonist': 'mortalAntagonist',
            'Magical Creature': 'magicalCreature',
            'Magical Item': 'magicalItem',
            'Cryptic Clue': 'crypticClue',
            'Secret Society': 'secretSociety',
            'Muerto Mask': 'muertoMask',
            'Muerto Body': 'muertoBody',
            'Muerto Headwear': 'muertoHeadwear'
        };

        selectedTropesData.forEach(trope => {
            trope.attributes.forEach((attr: { trait_type: string; value: any; }) => {
                const key = traitMapping[attr.value as string];
                if (key) {
                    values[key] = trope.name + " - " + trope.attributes.find((attr: { trait_type: string; }) => attr.trait_type === 'Text')?.value;
                }
            });
        });

        const finalPromptText = aiPrompt
            .replace('[Mortal Antagonist]', values.mortalAntagonist)
            .replace('[Magical Creature]', values.magicalCreature)
            .replace('[Magical Item]', values.magicalItem)
            .replace('[Cryptic Clue]', values.crypticClue)
            .replace('[Secret Society]', values.secretSociety)
            .replace('[Muerto Mask]', values.muertoMask)
            .replace('[Muerto Body]', values.muertoBody)
            .replace('[Muerto Headwear]', values.muertoHeadwear);
        
        console.info('finalPromptText:', finalPromptText);
        
        const assistant = await openai.beta.assistants.retrieve(assistantId);

        const thread = await openai.beta.threads.create({
            messages: [{ role: "user", content: finalPromptText }],
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
