import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export async function extractContent(url: string) {
    const cheerioResult = await extractContentWithCheerio(url);
  
    if (!cheerioResult || !cheerioResult.content) {
      console.log(`Falling back to Puppeteer for URL: ${url}`);
      return await extractContentWithPuppeteer(url);
    }
  
    return cheerioResult;
  }

export async function extractContentWithCheerio(url: string) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(html);

    const title = $('title').text() || $('h1').text();

    let content = '';

    const contentSelectors = [
      '.dcr-s3ycb2', // The Guardian
      'article', // Estrutura comum em muitos sites
      'main', // Estrutura comum
      'body', // Fallback para o corpo da página
    ];

    for (const selector of contentSelectors) {
      const elements = $(selector).find('p');
      if (elements.length > 0) {
        content = elements
          .map((_, el) => $(el).text().trim())
          .get()
          .join('\n');
        break;
      }
    }

    if (!content) {
      console.warn(`No content found for URL: ${url}`);
      return null;
    }

    return {
      title: title.trim(),
      content: content.trim(),
      url,
      date: new Date().toISOString(), // Data atual como placeholder
    };
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error);
    return null;
  }
}


export async function extractContentWithPuppeteer(url: string) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Desativa o sandbox
      });
      const page = await browser.newPage();
  
      await page.goto(url, { waitUntil: 'networkidle2' });
  
      const title = await page.title();
      const content = await page.evaluate(() => {
        const body = document.querySelector('body');
        return body ? body.innerText.trim() : '';
      });
  
      return {
        title,
        content,
        url,
        date: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error extracting content with Puppeteer from ${url}:`, error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }