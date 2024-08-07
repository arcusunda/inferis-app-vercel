import { getCollection, closeMongoDB } from '../../../utils/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Character } from '../../types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const character: Character = await request.json();

    character.tokenId = parseInt(character.tokenId as unknown as string, 10);


    const collection = await getCollection('characters');
    const historyCollection = await getCollection('characterHistory');

    const existingCharacter = await collection.findOne({ tokenId: character.tokenId });

    character.updated = new Date();

    if (existingCharacter) {
      character.created = existingCharacter.created;

      // Find the maximum version from the history collection
      const maxVersionDocument = await collection.find({ tokenId: character.tokenId }).sort({ version: -1 }).limit(1).toArray();
      const newVersion = maxVersionDocument.length > 0 ? maxVersionDocument[0].version + 1 : 2; // Initialize to 2 if no documents found, as version 1 is the new one

      // Insert current version of the character to history collection
      const { _id, ...historyCharacter } = existingCharacter; // Remove the _id field
      await historyCollection.insertOne(historyCharacter);

      character.version = newVersion;

      const result = await collection.updateOne({ tokenId: character.tokenId }, { $set: character });

      if (result && result.acknowledged) {
        return NextResponse.json({ info: 'Character updated successfully' }, { status: 200 });
      } else {
        return NextResponse.json({ result: `${result}` }, { status: 200 });
      }
    } else {
      character.created = new Date();
      character.version = 1;

      const result = await collection.insertOne(character);

      if (result && result.acknowledged) {
        return NextResponse.json({ info: 'Character created successfully' }, { status: 200 });
      } else {
        return NextResponse.json({ result: `${result}` }, { status: 200 });
      }
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}
