import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addAbstract } from '../../lib/database.js'; // Named import from database.ts
import nlp from '../../lib/nlp.js'; // Default import from nlp.ts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and process literature from abstracts.json
 */
export async function loadLiterature(): Promise<void> {
  try {
    const dataPath = path.join(__dirname, '../../../data/abstracts.json');
    const abstracts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    for (const abstract of abstracts) {
      // Add abstract to database
      const abstractId = await addAbstract({
        title: abstract.title,
        text: abstract.text,
        publicationDate: abstract.publicationDate,
        doi: abstract.doi
      });
      
      // Process abstract to extract entities and relations
      await nlp.processAbstract(abstractId, abstract.text); // Use nlp.processAbstract
    }
    
    console.log(`Processed ${abstracts.length} abstracts`);
  } catch (error) {
    console.error('Error loading literature:', error);
    throw error;
  }
}