import { generateEmbedding, generateResponse } from '../llm'; // Funções existentes
import { index } from '../database/pinecone'; // Conexão com o Pinecone

const resolvers = {
  Query: {
    agent: async (_: any, { query }: { query: string }) => {
      try {
        // Gera o embedding da consulta
        const queryEmbedding = await generateEmbedding(query);

        // Busca os artigos mais relevantes no Pinecone
        const searchResults = await index.query({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true,
        });

        // Extrai os metadados dos artigos encontrados
        const articles = searchResults.matches.map((match: any) => ({
          title: match.metadata?.title,
          url: match.metadata?.url,
          date: match.metadata?.date,
        }));

        // Gera uma resposta usando o Gemini
        const answer = await generateResponse(query, articles);

        // Retorna a resposta no formato GraphQL
        return {
          answer,
          sources: articles,
        };
      } catch (error) {
        throw new Error(`Error in GraphQL resolver: ${error}`);
      }
    },
  },
};

export default resolvers;