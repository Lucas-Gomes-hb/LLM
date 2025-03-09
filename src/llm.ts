import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Função para gerar embeddings usando o Gemini
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Função para gerar uma resposta usando o Gemini
export async function generateResponse(query: string, articles: { url: string; title: string; date: string }[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // Cria um prompt com a consulta e os artigos
  const prompt = `Com base nos seguintes artigos, responda à consulta: "${query}"\n\nArtigos:\n${articles
    .map((article) => `- ${article.title} (${article.date}): ${article.url}`)
    .join('\n')}`;

  // Gera a resposta
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
