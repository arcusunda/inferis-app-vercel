import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../utils/mongodb';
import Anthropic from '@anthropic-ai/sdk';

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
            .replaceAll('[Mortal Antagonist]', values.mortalAntagonist)
            .replaceAll('[Magical Creature]', values.magicalCreature)
            .replaceAll('[Magical Item]', values.magicalItem)
            .replaceAll('[Cryptic Clue]', values.crypticClue)
            .replaceAll('[Secret Society]', values.secretSociety)
            .replaceAll('[Muerto Mask]', values.muertoMask)
            .replaceAll('[Muerto Body]', values.muertoBody)
            .replaceAll('[Muerto Headwear]', values.muertoHeadwear);
        
        console.info('finalPromptText:', finalPromptText);

        const rootPrompts = await getCollection('rootPrompts');
        const knowledgeBase = await rootPrompts.findOne({ name: 'KnowledgeBase' })

        const anthropic = new Anthropic({
        });

        const msg = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 4096,
            messages: [{ role: "user", content: knowledgeBase + finalPromptText }],
        });

        let aiText = '';
        if (msg.content[0].type === 'text') {
            aiText = msg.content[0].text;
        } else {
            aiText = 'No response from AI';
        }
                
        return NextResponse.json({ aiText });

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
    } finally {
        closeMongoDB();
    }
}
