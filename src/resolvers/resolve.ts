import { generateEmbedding, generateResponse } from '../llm'; 
import { index } from '../database/pinecone';

const resolvers = {
  Query: {
    agent: async (_: any, { query }: { query: string }) => {
      try {
        const queryEmbedding = await generateEmbedding(query);

        const searchResults = await index.query({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true,
        });

        const articles = searchResults.matches.map((match: any) => ({
          title: match.metadata?.title,
          url: match.metadata?.url,
          date: match.metadata?.date,
          content: match.metadata?.content,
        }));

        const answer = await generateResponse(query, articles);

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