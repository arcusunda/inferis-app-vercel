import { getCollection, closeMongoDB } from '../../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const tokenId = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!tokenId || typeof tokenId !== 'string') {
    console.error('Invalid ID format');
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  const tokenIdNumber = Number(tokenId);

  console.info('Fetching tropes for tokenId:', tokenIdNumber);

  try {

    const characters = await getCollection('characters');
    const character = await characters.findOne({ tokenId: tokenIdNumber });

    if (character) {
      const attributes = character.attributes;
      let storyElementIds = [];
  
      for (let attr of attributes) {
          if (attr.trait_type === "StoryElements") {
              storyElementIds = attr.value.split(',').map((id: string) => parseInt(id.trim()));
              break;
          }
      }
  
      const storyElementsCollection = await getCollection('storyElements');
      const storyElements = await storyElementsCollection.find({ id: { $in: storyElementIds } }).toArray();
  
      console.log(storyElements);
  
      if (!storyElements) {
        return NextResponse.json({ error: 'Tropes not found' }, { status: 404 });
      }

      return NextResponse.json(storyElements);
    }
} catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  let { id, ipId, state, isRegistered, licenseTermsId, licenseTokenId, derivativeRegistration, childrenData, dateCanonized } = await request.json();
  const storyElementName = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!storyElementName || typeof storyElementName !== 'string') {
    console.error('Invalid ID format');
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('storyElements');
    const storyElement = await collection.findOne({ name: storyElementName });

    if (!storyElement) {
      return NextResponse.json({ error: 'StoryElement not found' }, { status: 404 });
    }

    if(!ipId ) {
      ipId = storyElement.ipId;
    }

    if(!state ) {
      state = storyElement.state;
    }

    if(!isRegistered ) {
      isRegistered = storyElement.isRegistered;
    }

    if(!licenseTermsId ) {
      licenseTermsId = storyElement.licenseTermsId;
    }

    if(!licenseTokenId ) {
      licenseTokenId = storyElement.licenseTokenId;
    }
    
    if(!derivativeRegistration ) {
      derivativeRegistration = storyElement.derivativeRegistration;
    }
 
    const result = await collection.updateOne(
      { name: storyElementName },
      {
        $set: {
          ipId,
          state,
          isRegistered,
          licenseTermsId,
          licenseTokenId,
          derivativeRegistration,
          childrenData,
          dateCanonized,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'StoryElement not found while updating' }, { status: 404 });
    }

    return NextResponse.json({ info: 'StoryElement updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
