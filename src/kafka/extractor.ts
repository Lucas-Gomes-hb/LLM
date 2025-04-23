import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export async function extractContent(url: string) {
  try {
    const cheerioResult = await extractContentWithCheerio(url);
    if (cheerioResult?.content) return cheerioResult;
    
    console.log(`Falling back to Puppeteer for URL: ${url}`);
    const puppeteerResult = await extractContentWithPuppeteer(url);
    if (puppeteerResult?.content) return puppeteerResult;
    
    return {
      title: 'Content Unavailable',
      content: `Could not extract content from ${url}`,
      url,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error in extractContent for ${url}:`, error);
    return null;
  }
}

export async function extractContentWithCheerio(url: string) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    });

    if (!html) throw new Error('Empty response');
    
    const $ = cheerio.load(html);

    $('script, style, noscript, iframe, embed, object, svg, img, figure, nav, footer, header, form, button, input, select, textarea').remove();

    const title = $('title').text() || 
                 $('h1').first().text() || 
                 $('meta[property="og:title"]').attr('content') || 
                 'Sem título';

    const contentSelectors = [
      'article', 
      'main', 
      '.article-content, .post-content, .content, .entry-content', 
      'body' 
    ];

    let content = '';
    let contentElement = null;

    for (const selector of contentSelectors) {
      if ($(selector).length) {
        contentElement = $(selector).first();
        break;
      }
    }

    if (!contentElement) {
      contentElement = $('body');
    }

    if (contentElement) {
      contentElement.find('*').each(function() {
        const el = $(this);
        if (el.is('div, span, section, aside') && !el.text().trim()) {
          el.remove();
        }
      });

      const textElements = contentElement.find('p, h2, h3, h4, h5, h6, li, blockquote');
      
      if (textElements.length > 0) {
        content = textElements
          .map((_, el) => {
            const text = $(el).text().trim();
            if ($(el).is('h2, h3, h4, h5, h6')) {
              return '\n\n' + text + '\n\n';
            }
            return text;
          })
          .get()
          .join('\n');
      } else {
        content = contentElement.text();
      }
    }

    content = cleanText(content);

    if (!content) {
      console.warn(`No content found for URL: ${url}`);
      return null;
    }

    return {
      title: title.trim(),
      content: content.trim(),
      url,
      date: new Date().toISOString(),
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
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
      });
      const page = await browser.newPage();
  
      await page.goto(url, { waitUntil: 'networkidle2' });
  
      await page.evaluate(() => {
        const elements = document.querySelectorAll(
          'script, style, noscript, iframe, embed, object, svg, img, figure, nav, footer, header, form, button, input, select, textarea'
        );
        elements.forEach(el => el.remove());
      });
  
      const title = await page.title();
      
      const content = await page.evaluate(() => {
        const findMainContent = () => {
          const selectors = [
            'article',
            'main',
            '.article-content', '.post-content', '.content', '.entry-content',
            'body'
          ];
          
          for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
          }
          return document.body;
        };
        
        const mainContent = findMainContent();
        if (!mainContent) return '';
        
        const textElements = mainContent.querySelectorAll('p, h2, h3, h4, h5, h6, li, blockquote');
        let content = '';
        
        if (textElements.length > 0) {
          textElements.forEach(el => {
            const text = el.textContent?.toString().trim();
            if (text) {
              if (el.tagName.match(/^H[2-6]$/)) {
                content += '\n\n' + text + '\n\n';
              } else {
                content += text + '\n';
              }
            }
          });
        } else {
          content = mainContent.textContent?.toString()?? "";
        }
        
        return content;
      });
  
      return {
        title,
        content: cleanText(content).trim(),
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

function cleanText(text: string): string {
  if (!text) return '';
  
  text = text.replace(/\s+/g, ' ');
  
  text = text.replace(/\n+/g, '\n');
  
  text = text.trim();
  
  return text;
}