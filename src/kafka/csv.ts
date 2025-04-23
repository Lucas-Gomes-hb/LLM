import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { extractContent } from './extractor';
import { saveArticle } from '../database/pinecone';

interface CSVRow {
  Source: string;
  URL: string;
}

interface Article {
  title: string;
  content: string;
  url: string;
  date: string;
  source?: string;  // Propriedade opcional
}

export class CSVProcessor {
  private readonly csvPath = path.resolve(__dirname, '../../articles_dataset.csv');

  public async processCSV(): Promise<void> {
    if (!fs.existsSync(this.csvPath)) {
      throw new Error(`CSV file not found at ${this.csvPath}`);
    }

    const articles = await this.readCSV();
    console.log(`Processing ${articles.length} articles from CSV fallback`);

    for (const article of articles) {
      await this.processArticle(article);
    }
  }

  private async readCSV(): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const results: CSVRow[] = [];
      
      fs.createReadStream(this.csvPath)
        .pipe(csv())
        .on('data', (data: CSVRow) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private async processArticle(row: CSVRow): Promise<void> {
    try {
      if (!row.URL.startsWith('http')) {
        console.warn(`Invalid URL: ${row.URL}`);
        return;
      }

      const article = await extractContent(row.URL);
      if (article) {
        const articleWithSource: Article = {
          ...article,
          source: row.Source  // Adiciona a propriedade source
        };
        await saveArticle(articleWithSource);
        console.log(`Processed [CSV]: ${article.title}`);
      }
    } catch (error) {
      console.error(`Failed to process CSV article ${row.URL}:`, error as Error);
    }
  }
}

export const csvProcessor = new CSVProcessor();