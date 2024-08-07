import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../utils/mongodb';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    const { aspect, bodyData, maskData, headwearData } = await request.json();

    try {
        const collection = await getCollection('storyElements');
        const existingStoryElementsData = await collection.find({
            'attributes': {
                $not: {
                    $elemMatch: {
                        'trait_type': 'Aspect',
                        'value': { $in: ['Muerto Body', 'Muerto Mask', 'Muerto Headwear'] }
                    }
                }
            },
            'name': { $not: /^[0-9]+$/ }
        }).toArray();
        
        let values = {
            aspect: '[Aspect]',
            existingStoryElements: existingStoryElementsData.map(storyElement => {
                const textAttribute = storyElement.attributes.find((attr: { trait_type: string }) => attr.trait_type === 'Text')?.value;
                return `${storyElement.name}`;
//                return `${storyElement.name} - ${textAttribute}`;
            }).join(', ')
        };

        const rootPrompts = await getCollection('rootPrompts');
        const createStoryElementPrompt = await rootPrompts.findOne({ name: 'CreateStoryElement' })

        const finalPromptText = createStoryElementPrompt
            ? createStoryElementPrompt.promptText.replaceAll('[Aspect]', aspect)
            .replaceAll('[Existing Story Elements]', values.existingStoryElements) : '';
        
        const knowledgeBase = await rootPrompts.findOne({ name: 'KnowledgeBaseSummarized' })

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
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
            aiText = 'No response from Antropic AI';
        }
              
        return NextResponse.json({ aiText });

    } catch (error) {
        console.error('Error calling Antropic API:', error);
        return NextResponse.json({ error: 'Failed to fetch Antropic AI response' }, { status: 500 });
    } finally {
        closeMongoDB();
    }
}
