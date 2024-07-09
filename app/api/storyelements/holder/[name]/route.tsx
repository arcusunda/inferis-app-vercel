import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../../utils/mongodb';
import { HolderStoryElement } from '../../../../types';
import { Collection, Document } from 'mongodb';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const name = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid holderStoryElement name format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('holderStoryElements');
    let holderStoryElement: HolderStoryElement | null = await collection.findOne<HolderStoryElement>({ name: name });

    if (!holderStoryElement) {
        holderStoryElement = {
            id: await getNextHolderStoryElementId(collection),
            name: name,
            description: '',
            image: '',
            aspect: '',
            state: 'Draft',
            authorAddress: '',
            tokenId: '',
            isSubmitted: false,
            created: new Date()
        };

        await collection.insertOne(holderStoryElement);
    }

    return NextResponse.json(holderStoryElement);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  const { id, name, description, image, aspect, created, attributes } = await request.json();

  try {
    const collection = await getCollection('holderStoryElements');
    const existingElement = await collection.findOne({ name });

    if (existingElement) {
      const updatedAttributes = mergeAttributes(existingElement.attributes, attributes);

      const result = await collection.updateOne(
        { name },
        {
          $set: {
            description,
            image,
            aspect,
            created: new Date(),
            attributes: updatedAttributes,
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Holder Story Element not found while updating' }, { status: 404 });
      }

      return NextResponse.json({ info: 'Holder Story Element updated successfully' }, { status: 200 });
    } else {
      const nextId = await getNextHolderStoryElementId(collection);

      const newHolderStoryElement = {
        id: nextId,
        name,
        description,
        image,
        aspect,
        created: new Date(),
        attributes: attributes,
      };

      await collection.insertOne(newHolderStoryElement);

      return NextResponse.json({ info: 'Holder Story Element created successfully' }, { status: 201 });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

async function getNextHolderStoryElementId(collection: Collection<Document>) {
  const maxRootStoryElement = await collection.find().sort({ id: -1 }).limit(1).toArray();
  const nextId = maxRootStoryElement.length > 0 ? maxRootStoryElement[0].id + 1 : 1;
  return nextId;
}

function mergeAttributes(existingAttributes: any[], newAttributes: any[]) {
  const mergedAttributes = [...existingAttributes];
  newAttributes.forEach((newAttr) => {
    const index = mergedAttributes.findIndex((attr) => attr.trait_type === newAttr.trait_type);
    if (index > -1) {
      mergedAttributes[index] = newAttr;
    } else {
      mergedAttributes.push(newAttr);
    }
  });
  return mergedAttributes;
}
