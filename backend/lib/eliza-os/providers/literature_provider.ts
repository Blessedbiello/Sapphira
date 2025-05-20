import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addAbstract, processAbstract } from '../../lib/database.js';

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
      const abstractId = addAbstract({
        title: abstract.title,
        text: abstract.text,
        publicationDate: abstract.publicationDate,
        doi: abstract.doi
      });
      
      // Process abstract to extract entities and relations
      await processAbstract(abstractId, abstract.text);
    }
    
    console.log(`Processed ${abstracts.length} abstracts`);
  } catch (error) {
    console.error('Error loading literature:', error);
    throw error;
  }
}