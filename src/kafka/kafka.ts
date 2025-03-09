import { Kafka, Consumer } from 'kafkajs';
import dotenv from 'dotenv';
import { extractContent } from './extractor';
import { saveArticle } from '../database/pinecone';

dotenv.config();

const kafka = new Kafka({
  clientId: 'news-article-agent',
  brokers: [process.env.KAFKA_BROKER!],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!,
  },
});

const consumer = kafka.consumer({
  groupId: `${process.env.KAFKA_GROUP_ID_PREFIX}${Date.now()}`,
});


// Função para conectar e consumir mensagens
export async function startKafkaConsumer() {
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: process.env.KAFKA_TOPIC_NAME!, fromBeginning: true });
  
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const messageValue = message.value?.toString();
  
          if (messageValue) {
            try {
              // Parseia o JSON recebido
              const event = JSON.parse(messageValue);
  
              // Extrai a URL do campo value.url
              const url = event.value?.url;
  
              if (url) {
                console.log(`Processing URL: ${url}`);
  
                // Extrai o conteúdo do link
                const article = await extractContent(url);
  
                if (article) {
                  console.log('Extracted article:', article);
                  // Aqui você pode salvar o artigo no Pinecone
                  saveArticle(article);
                }
              } else {
                console.error('URL not found in message:', event);
              }
            } catch (error) {
              console.error('Error parsing Kafka message:', error);
            }
          }
        },
      });
    } catch (error) {
      console.error('Error in Kafka consumer:', error);
    }
  }