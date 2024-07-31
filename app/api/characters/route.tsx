import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Character } from '../../types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const character: Character = await request.json();

    character.tokenId = parseInt(character.tokenId as unknown as string, 10);

    console.info('Character tokenId:', character.tokenId);

    const collection = await getCollection('characters');

    const existingCharacter = await collection.findOne(
      { tokenId: character.tokenId }
    );

    character.updated = new Date();
    if (existingCharacter) {
      character.created = existingCharacter.created;
    }

    const result = await collection.findOneAndUpdate(
      { tokenId: character.tokenId },
      { $set: character },
      { upsert: true, returnDocument: 'after' }
    );

    if (result && result.ok) {
      return NextResponse.json({ info: 'Character saved successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ result: `${result}` }, { status: 200 });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
