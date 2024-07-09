import { NextRequest, NextResponse } from 'next/server';
import { getCollection, closeMongoDB } from '../../../utils/mongodb';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenIdStr = searchParams.get('tokenId');

    if (!tokenIdStr) {
      return NextResponse.json({ error: 'TokenId is required' }, { status: 400 });
    }

    const tokenId = parseInt(tokenIdStr, 10);

    if (isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid tokenId format' }, { status: 400 });
    }

    const collection = await getCollection('characterNames');

    console.info('GET /api/characters', { tokenId });
    const characterName = await collection.findOne({ tokenId });

    if (!characterName) {
      return NextResponse.json({ error: 'Character name not found' }, { status: 404 });
    }

    const character = {
      tokenId: characterName.tokenId,
      givenName: characterName.givenName,
      surname: characterName.surname
    };

    return NextResponse.json(character, { status: 200 });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

export async function POST(request: NextRequest) {
  const { givenName, surname, tokenId } = await request.json();

  if (!givenName || !surname || typeof givenName !== 'string' || typeof surname !== 'string' || !tokenId || typeof tokenId !== 'number') {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const collection = await getCollection('characterNames');

    const characterNameAlreadyAssigned = await collection.findOne({ givenName, surname, tokenId });
    if(characterNameAlreadyAssigned) {
      return NextResponse.json({ info: 'Character updated successfully' }, { status: 200 });
    }

    const existingCharacterName = await collection.findOne({ givenName, surname });

    if (existingCharacterName) {
      return NextResponse.json({ error: 'Given name not available' }, { status: 409 });
    }

    const newCharacter = {
      tokenId,
      givenName,
      surname
    };

    const existingCharacterNameByTokenId = await collection.findOne({ tokenId });

    if (existingCharacterNameByTokenId) {
      const result = await collection.updateOne(
        { tokenId },
        { $set: { givenName, surname } }
      );

      if (result.modifiedCount > 0) {
        return NextResponse.json({ info: 'Character updated successfully' }, { status: 200 });
      } else {
        return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
      }
    } else {
      await collection.insertOne(newCharacter);
    }

    return NextResponse.json(newCharacter, { status: 201 });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
