import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export async function saveArticle(article: {
  title: string;
  content: string;
  url: string;
  date: string;
  source?: string
}) {
  try {
    const vector = await generateEmbedding(article.content);

    await index.upsert([
      {
        id: article.url, // Usa a URL como ID único
        values: vector,
        metadata: {
          title: article.title,
          content: article.content,
          url: article.url,
          date: article.date,
          ...(article.source && { source: article.source })
        },
      },
    ]);

    console.log(`Article saved to Pinecone: ${article.title}`);
  } catch (error) {
    console.error('Error saving article to Pinecone:', error);
  }
}


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const truncatedText = text.slice(0, 8000);

    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(truncatedText);

    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    throw error;
  }
}