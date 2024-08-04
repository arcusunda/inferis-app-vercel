import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const isRootParam = url.searchParams.get('isRoot');
    const addressParam = url.searchParams.get('address');
    const aspectParam = url.searchParams.get('aspect');
    const isRoot = isRootParam === 'true';
    const muertoAttributeParam = url.searchParams.get('muertoAttributeParam');
    const muertoAttributeParamSplit = muertoAttributeParam ? muertoAttributeParam.split('/').pop()?.replaceAll('%20', ' ') : null;
    console.info('muertoAttributeParam:', muertoAttributeParam);

    const collection = await getCollection('storyElements');
    
    let query: any = {};
    if (isRoot) {
      query.isRoot = true;
    }
    if (addressParam) {
      query.address = addressParam;
    }

    if (aspectParam) {
      query.attributes = {
        $elemMatch: {
          trait_type: 'Aspect',
          value: aspectParam
        }
      };
    }
    
    if(muertoAttributeParamSplit) {
      const storyElement = await collection.findOne({ name: muertoAttributeParamSplit });
      return NextResponse.json(storyElement);
    } else {
      const storyElements = await collection.find(query).toArray();
      return NextResponse.json(storyElements);
    }
    
  } catch (error) {
    console.error('Error fetching story elements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newStoryElement } = body;

    const { name, description, image, aspect, text, parents, state, address } = newStoryElement;

    if (!name || !description || !image || !state || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await getCollection('storyElements');

    const existingElement = await collection.findOne({ name, address });

    if (existingElement) {
      const updatedAttributes = [
        { trait_type: 'Aspect', value: aspect },
        { trait_type: 'Text', value: text },
        { trait_type: 'Parents', value: parents }
      ];

      const updateData = {
        $set: {
          description,
          image,
          attributes: updatedAttributes,
          state,
          address,
          updated: new Date()
        }
      };

      const result = await collection.updateOne({ name, address }, updateData);

      if (result.matchedCount > 0) {
        return NextResponse.json({ message: 'StoryElement updated successfully', storyElement: { ...existingElement, ...updateData.$set } });
      } else {
        return NextResponse.json({ error: 'Failed to update StoryElement' }, { status: 500 });
      }
    } else {
      const maxIdDocument = await collection.find().sort({ id: -1 }).limit(1).toArray();
      const newId = maxIdDocument[0] ? maxIdDocument[0].id + 1 : 1; // Initialize to 1 if no documents found

      const newAttributes = [
        { trait_type: 'Aspect', value: aspect },
        { trait_type: 'Text', value: text },
        { trait_type: 'Parents', value: parents }
      ];

      const newStoryElementData = {
        id: newId,
        name,
        description,
        image,
        attributes: newAttributes || [],
        state,
        address,
        created: new Date(),
      };

      const result = await collection.insertOne(newStoryElementData);

      if (result.insertedId) {
        return NextResponse.json({ message: 'StoryElement created successfully', storyElement: newStoryElementData });
      } else {
        return NextResponse.json({ error: 'Failed to create StoryElement' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error processing POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
