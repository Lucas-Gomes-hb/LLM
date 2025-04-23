---

# News Article Agent

The **News Article Agent** is a Node.js application that integrates a large language model (LLM) with a vector database to create a **Retrieval-Augmented Generation (RAG)** system. It ingests news links, extracts and cleans the content, and responds to user queries based on the stored articles.

---

## Features

- **Data Ingestion**:
  - Consumes news links in real-time via Kafka.
  - Extracts and cleans article content using an LLM.
  - Stores data in a vector database (Pinecone).

- **Query Response**:
  - Answers questions based on stored articles.
  - Recognizes links provided in queries and responds based on the article's content.

- **GraphQL API**:
  - Exposes a GraphQL endpoint for queries.
  - Returns structured responses with sources and metadata.

---

## Technologies Used

- **Backend**: Node.js with TypeScript.
- **Vector Database**: Pinecone.
- **LLM**: Gemini (Google Generative AI).
- **Data Streaming**: Kafka.
- **API**: GraphQL with `graphql-yoga`.
- **Development Tools**:
  - Docker and Docker Compose for containerization.
  - Postman for API testing.

---

## How to Run the Project

### Prerequisites

- **Docker**: Install Docker and Docker Compose.
- **Node.js**: Version 18 or higher.
- **Yarn**: Package manager (optional, you can use npm).

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/Lucas-Gomes-hb/LLM
cd LLM
```

---

### Step 2: Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PINECONE_API_KEY=""
PINECONE_INDEX_NAME="news-articles"
GEMINI_API_KEY=""
KAFKA_BROKER=""
KAFKA_USERNAME=""
KAFKA_PASSWORD=""
KAFKA_TOPIC_NAME="news"
KAFKA_GROUP_ID_PREFIX="test-task-"

```

---

### Step 3: Build and Run the Containers

Run the following command to build and run the services:

```bash
docker-compose up --build
```

This will:
1. Start Zookeeper.
2. Start Kafka.
3. Build and start the GraphQL API.

---

### Step 4: Access the API

The GraphQL API will be available at:

```
http://localhost:3000/graphql
```

---

## How to Use the API

### Example GraphQL Query

In the GraphQL Playground (`http://localhost:3000/graphql`), you can test a query like this:

```graphql
query {
  agent(query: "Tell me the latest news about Justin Trudeau") {
    answer
    sources {
      title
      url
      date
    }
  }
}
```

### Example Response

```json
{
  "data": {
    "agent": {
      "answer": "Justin Trudeau recently announced new climate policies...",
      "sources": [
        {
          "title": "Justin Trudeau announces new climate policies",
          "url": "https://example.com/news/justin-trudeau-climate",
          "date": "2023-10-25"
        },
        {
          "title": "Canada's response to climate change",
          "url": "https://example.com/news/canada-climate-change",
          "date": "2023-10-24"
        }
      ]
    }
  }
}
```

---

## Project Structure

```
/project
│
├── src/
│   ├── index.ts              # Application entry point
│   ├── resolvers/            # GraphQL Resolvers
│   │   └── resolve.ts
│   ├── schema.graphql        # GraphQL Schema
│   ├── llm.ts                # LLM Integration (Gemini)
│   ├── pinecone.ts           # Pinecone Integration
│   └── kafka.ts              # Kafka Consumer
│
├── Dockerfile                # Docker container configuration
├── docker-compose.yml        # Docker services configuration
├── .env                      # Environment variables
├── package.json              # Project dependencies
├── yarn.lock                 # Dependency versions
└── README.md                 # Project documentation
```

---

## Implemented Optimizations

1. **Embeddings Caching**:
   - Stores generated embeddings to reduce token cost and improve latency.

2. **Response Streaming**:
   - Implements response streaming to improve user experience.

3. **Monitoring with Langfuse**:
   - Integrates Langfuse for monitoring and debugging the RAG pipeline.

4. **Kafka Usage**:
   - Processes messages in real-time with fault handling and reprocessing.

---

## Contact

If you have questions or suggestions, please contact:

- **Name**: Lucas
- **Email**: lucas.gomes.pessoal@gmail.com
- **GitHub**: [Lucas Gomes](https://github.com/Lucas-Gomes-hb/)
