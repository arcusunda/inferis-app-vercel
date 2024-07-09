import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Collection } from 'mongodb';
import { Talent, TraitCategoryMap, TraitCategories, Category, Muerto } from '../../../types';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const tokenId = pathname.split('/').pop()?.replaceAll('%20', ' ');

  console.info('GET /api/talents/', tokenId);
  if (!tokenId || typeof tokenId !== 'string') {
    console.error('Invalid tokenId format');
    return NextResponse.json({ error: 'Invalid tokenId format' }, { status: 400 });
  }

  try {
    const muertosCollection = (await getCollection('nftMetadata')) as unknown as Collection<Muerto>;
    const muerto = await muertosCollection.findOne({ name: 'Los Muertos #' + tokenId });

    if (!muerto) {
      console.info('Muerto not found: ', 'Los Muertos #' + tokenId);
      return NextResponse.json({ info: 'Muerto not found' }, { status: 200 });
    }

    console.info('Muerto found:', muerto);
    const { attributes } = muerto;

    const traitTypes = ['Mask', 'Body', 'Headwear', 'Expression'];
    const traitValues = traitTypes.reduce((acc, type) => {
      const value = attributes.find(attr => attr.trait_type === type)?.value;
      if (value) acc[type.toLowerCase()] = value;
      return acc;
    }, {} as { [key: string]: string | undefined });

    const traitCategories = await Promise.all(
      Object.entries(traitValues).map(async ([type, value]) => {
        if (value) {
          const traitCategoryMapCollection = (await getCollection('traitCategoryMap')) as unknown as Collection<TraitCategoryMap>;
          const traitCategoryDoc = await traitCategoryMapCollection.findOne({ trait: value });
          return { [type]: traitCategoryDoc?.categoryId };
        }
        return { [type]: undefined };
      })
    );

    const talentCategoryIds = traitCategories.reduce((acc, curr) => ({ ...acc, ...curr }), {} as TraitCategories);

    const talents: Talent[] = [];

    for (const [type, categoryId] of Object.entries(talentCategoryIds)) {
      if (categoryId !== undefined) {
        const talentsCollection = (await getCollection(`${type}Talents`)) as unknown as Collection<Talent>;
        const categoryCollection = (await getCollection(`${type}Categories`)) as unknown as Collection<Category>;
        const category = await categoryCollection.findOne({ id: categoryId });
        if (!category) continue;

        const collectionTalents = await talentsCollection.find({ categoryId }).toArray();

        collectionTalents.forEach(talent => {
          talent.categoryName = category.name;
          talent.categoryType = type;
        });
        talents.push(...collectionTalents);
      }
    }
console.info(`talents: ${talents}`)
    return NextResponse.json(talents);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
