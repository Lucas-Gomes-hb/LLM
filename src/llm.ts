import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function generateResponse(query: string, articles: { url: string; title: string; date: string; content: string}[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `Using this articles awnser this: "${query}"\n\nArticles:\n${articles
    .map((article) => `- ${article.title} ${article.content} (${article.date}): ${article.url}`)
    .join('\n')}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
