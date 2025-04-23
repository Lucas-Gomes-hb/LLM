import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { join } from 'path';
import { makeExecutableSchema } from '@graphql-tools/schema';
import resolvers from './resolvers/resolve';
import { startKafkaConsumer } from './kafka/kafka';

startKafkaConsumer();

const typeDefs = loadSchemaSync(join(__dirname, 'schema.graphql'), {
  loaders: [new GraphQLFileLoader()],
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
});

const server = createServer(yoga);

server.listen(3000, () => {
  console.log(`GraphQL server is running on http://localhost:3000/graphql`);
});