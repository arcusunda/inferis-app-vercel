import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../../utils/mongodb';
import { OpenAiModel } from '../../../../../utils/utils';
import { Talent } from '../../../../types';
import OpenAI from 'openai';
import { Collection } from 'mongodb';

const openai = new OpenAI();
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    const { promptText, storyElementIds, selectedTalents } = await request.json();

  try {
    const storyElementIdentifiers = storyElementIds.split(',').map((id: string) => parseInt(id.trim(), 10));

    const selectedTalentsSets = Object.fromEntries(
      Object.entries(selectedTalents).map(([key, value]) => [key, new Set(value as number[])])
    );

    const talentIdentifiers: number[] = [];
    Object.values(selectedTalentsSets).forEach((talentSet: Set<number>) => {
      talentSet.forEach(talentId => {
        talentIdentifiers.push(talentId);
      });
    });

    const talentsData: Talent[] = [];

    for (const [categoryKey, talentSet] of Object.entries(selectedTalentsSets)) {
      if (talentSet instanceof Set) {
        const talentIds = Array.from(talentSet) as number[];

        if (talentIds.length > 0) {
          const collection = (await getCollection(categoryKey)) as unknown as Collection<Talent>;
          const fetchedTalents = await collection.find({ id: { $in: talentIds } }).toArray();
          talentsData.push(...fetchedTalents);
        }
      } else {
        console.error(`Expected Set for ${categoryKey}, but got`, typeof talentSet);
      }
    }

    const descriptions = talentsData.map(talent => talent.description);
    const allTalentDescriptions = descriptions.join('. ');

    const collection = await getCollection('storyElements');
    const storyElementsData = await collection.find({ id: { $in: storyElementIdentifiers } }).toArray();
    const storyText = storyElementsData.map(element => {
        const textAttribute = element.attributes.find((attr: { trait_type: string; }) => attr.trait_type === 'Text');
        return textAttribute ? textAttribute.value : '';
      }).join('\n');
      
    const finalPromptText = `${promptText}\n${storyText}.\n Character talents: ${allTalentDescriptions}`;
    console.info(`finalPromptText: ${finalPromptText}`);


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
