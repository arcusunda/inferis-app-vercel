import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { StoryElementDescription } from '../../../utils/utils';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const name = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('storyElements');

    const storyElement = await collection.findOne({ name });

    if (!storyElement) {
      return NextResponse.json({ error: 'Story Element not found' }, { status: 404 });
    }

    return NextResponse.json(storyElement);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  const { id, name, image, wbpImage, isRoot, author, isSubmitted, created, attributes } = await request.json();

  try {
    const collection = await getCollection('storyElements');
    const existingStoryElement = await collection.findOne({ name });

    if (existingStoryElement) {
      const updatedAttributes = mergeAttributes(existingStoryElement.attributes, attributes);

      const result = await collection.updateOne(
        { name },
        {
          $set: {
            description: StoryElementDescription,
            image,
            wbpImage,
            isRoot,
            author,
            isSubmitted,
            created: new Date(),
            attributes: updatedAttributes
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Story Element not found while updating' }, { status: 404 });
      }

      return NextResponse.json({ info: 'Story Element updated successfully' }, { status: 200 });
    } else {
      const nextId = await getNextStoryElementId();

      const newStoryElement = {
        id: nextId,
        name,
        description: StoryElementDescription,
        image,
        wbpImage,
        isRoot,
        author,
        isSubmitted,
        created: new Date(),
        attributes: attributes
      };

      await collection.insertOne(newStoryElement);

      return NextResponse.json({ info: 'Story Element created successfully' }, { status: 201 });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

async function getNextStoryElementId() {
  try {
    const collection = await getCollection('storyElements');
    const maxStoryElement = await collection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxStoryElement.length > 0 ? maxStoryElement[0].id + 1 : 1;
    return nextId;
  } catch (error) {
    console.error('Internal Server Error:', error);
    return null;
  }
}

function mergeAttributes(existingAttributes: any[], newAttributes: any[]) {
  const updatedAttributes = [...existingAttributes];

  newAttributes.forEach(newAttr => {
    const attrIndex = updatedAttributes.findIndex(attr => attr.trait_type === newAttr.trait_type);
    if (attrIndex !== -1) {
      updatedAttributes[attrIndex].value = newAttr.value;
    } else {
      updatedAttributes.push(newAttr);
    }
  });

  return updatedAttributes;
}
