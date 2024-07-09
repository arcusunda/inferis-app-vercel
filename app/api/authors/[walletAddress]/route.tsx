import { NextRequest, NextResponse } from 'next/server';
import { closeMongoDB, getCollection } from '../../../../utils/mongodb';
import { Author } from '../../../types';
import { Collection, Document } from 'mongodb';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const walletAddress = pathname.split('/').pop()?.replaceAll('%20', ' ');

  if (!walletAddress || typeof walletAddress !== 'string') {
    return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
  }

  try {
    const collection = await getCollection('authors');
    let author: Author | null = await collection.findOne<Author>({ address: walletAddress });

    if (!author) {
        author = {
            id: await getNextAuthorId(collection),
            name: walletAddress,
            role: 'Unknown',
            address: walletAddress,
        };

        await collection.insertOne(author);
    }

    author.name = author.name + ' (' + walletAddress.substring(0, 6) + '...)';
    return NextResponse.json(author);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    closeMongoDB();
  }
}

async function getNextAuthorId(collection: Collection<Document>) {
  const maxAuthor = await collection.find().sort({ id: -1 }).limit(1).toArray();
  const nextId = maxAuthor.length > 0 ? maxAuthor[0].id + 1 : 1;
  return nextId;
}
