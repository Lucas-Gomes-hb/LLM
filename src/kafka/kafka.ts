import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { extractContent } from './extractor';
import { saveArticle } from '../database/pinecone';
import { csvProcessor } from './csv';
import { setTimeout } from 'timers/promises';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const kafka = new Kafka({
  clientId: 'news-article-agent',
  brokers: [process.env.KAFKA_BROKER!],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!
  },
  retry: {
    initialRetryTime: 1000,
    retries: 5
  }
});

export async function startKafkaConsumer() {
  const consumer = kafka.consumer({
    groupId: `${process.env.KAFKA_GROUP_ID_PREFIX}${Date.now()}`,
    retry: {
      retries: 3,
      factor: 0.5
    }
  });

  try {
    await connectWithRetry(consumer);

    const topic = process.env.KAFKA_TOPIC_NAME || 'news';
    await subscribeWithFallback(consumer, topic);

    await runConsumerWithHandlers(consumer);
    
  } catch (error) {
    console.error('Critical Kafka failure, falling back to CSV:', error);
    await csvProcessor.processCSV();
  }
}

// Helper Functions

async function connectWithRetry(consumer: Consumer, attempt = 1): Promise<void> {
  try {
    await consumer.connect();
    console.log('Successfully connected to Kafka');
  } catch (error:any) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`Failed to connect after ${MAX_RETRIES} attempts: ${error.message}`);
    }
    
    console.warn(`Connection attempt ${attempt} failed, retrying...`);
    await setTimeout(RETRY_DELAY_MS);
    return connectWithRetry(consumer, attempt + 1);
  }
}

async function subscribeWithFallback(consumer: Consumer, topic: string): Promise<void> {
  try {
    await consumer.subscribe({ 
      topic,
      fromBeginning: true 
    });
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Failed to subscribe to topic ${topic}:`, error);
    
    // Fallback 1: Try creating topic if not exists
    try {
      const admin = kafka.admin();
      await admin.connect();
      await admin.createTopics({
        topics: [{
          topic,
          numPartitions: 1,
          replicationFactor: 1
        }]
      });
      await admin.disconnect();
      
      console.log(`Created topic ${topic}, retrying subscription...`);
      await consumer.subscribe({ topic });
    } catch (createError) {
      console.error('Topic creation failed, switching to CSV fallback');
      throw createError;
    }
  }
}

async function runConsumerWithHandlers(consumer: Consumer): Promise<void> {
  await consumer.run({
    autoCommit: false,
    partitionsConsumedConcurrently: 3, // Parallel processing
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log(`Processing [${topic}/${partition}/${message.offset}]`);
        
        const url = await processKafkaMessage(message);
        if (!url) return;

        const success = await processArticleWithRetry(url);
        if (success) {
          await consumer.commitOffsets([{
            topic,
            partition,
            offset: (Number(message.offset) + 1).toString()
          }]);
        }
      } catch (error) {
        console.error(`Failed to process message ${message.offset}:`, error);
      }
    }
  });
}

async function processKafkaMessage(message: KafkaMessage): Promise<string | null> {
  try {
    const value = JSON.parse(message.value?.toString() || '');
    if (!value.url) {
      throw new Error('Missing URL in message');
    }
    return value.url;
  } catch (error) {
    console.error('Invalid message format:', message.value?.toString());
    return null;
  }
}

async function processArticleWithRetry(url: string, attempt = 1): Promise<boolean> {
  try {
    console.log(`Processing URL [Attempt ${attempt}]: ${url}`);
    const article = await extractContent(url);
    
    if (!article) {
      throw new Error('Failed to extract article content');
    }

    await saveArticle(article);
    console.log(`Saved: ${article.title}`);
    return true;
    
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.error(`Permanent failure for ${url}:`, error);
      return false;
    }
    
    await setTimeout(RETRY_DELAY_MS * attempt);
    return processArticleWithRetry(url, attempt + 1);
  }
}