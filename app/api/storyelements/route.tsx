import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const isRootParam = url.searchParams.get('isRoot');
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

    const { id, name, description, image, attributes, state, created } = newStoryElement;

    if (!id || !name || !description || !image || !state || !created) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newStoryElementData = {
      id,
      name,
      description,
      image,
      attributes: attributes || [],
      state,
      created: new Date(created),
    };

    const collection = await getCollection('storyElements');
    const result = await collection.insertOne(newStoryElementData);

    if (result.insertedId) {
      return NextResponse.json({ message: 'StoryElement created successfully', storyElement: newStoryElementData });
    } else {
      return NextResponse.json({ error: 'Failed to create StoryElement' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
