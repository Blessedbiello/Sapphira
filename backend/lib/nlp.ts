import natural from 'natural';
import {
  addEntity,
  addRelation,
  Entity,
  Relation
} from './database.js';

// Tokenizer for text processing
const tokenizer = new natural.WordTokenizer();

// Define biological entity types
enum EntityType {
  HORMONE = 'hormone',
  PLANT_PART = 'plant_part',
  PROCESS = 'process',
  STRESS_FACTOR = 'stress_factor',
  GENE = 'gene',
  PROTEIN = 'protein',
  SIGNALING_MOLECULE = 'signaling_molecule'
}

// Define relation types
enum RelationType {
  AFFECTS = 'affects',
  INHIBITS = 'inhibits',
  ACTIVATES = 'activates',
  REGULATES = 'regulates',
  ASSOCIATED_WITH = 'associated_with',
  PART_OF = 'part_of',
  CAUSES = 'causes',
  RESPONDS_TO = 'responds_to'
}

// Dictionary of common biological entities for simplified NLP
const entityDictionary = {
  [EntityType.HORMONE]: [
    'jasmonic acid', 'JA', 'abscisic acid', 'ABA', 'ethylene', 'auxin', 
    'cytokinin', 'gibberellin', 'salicylic acid', 'SA', 'brassinosteroid',
    'strigolactone', 'jasmonates'
  ],
  [EntityType.PLANT_PART]: [
    'stomata', 'stomatal', 'root', 'leaf', 'leaves', 'stem', 'shoot', 
    'flower', 'seed', 'guard cell', 'guard cells', 'chloroplast', 
    'mitochondria', 'cell wall'
  ],
  [EntityType.PROCESS]: [
    'stomatal closure', 'closure', 'transpiration', 'photosynthesis',
    'respiration', 'germination', 'flowering', 'senescence', 'growth',
    'development', 'signaling', 'signal transduction', 'ion transport',
    'water uptake', 'osmotic regulation'
  ],
  [EntityType.STRESS_FACTOR]: [
    'drought', 'heat', 'cold', 'salinity', 'flooding', 'pathogen',
    'herbivore', 'UV radiation', 'high light', 'oxidative stress',
    'water stress', 'biotic stress', 'abiotic stress'
  ],
  [EntityType.GENE]: [
    'MYC2', 'COI1', 'JAZ', 'DREB', 'NPR1', 'EIN3', 'CTR1', 'SLAC1',
    'OST1', 'ABI1', 'ABI2', 'MYB'
  ],
  [EntityType.PROTEIN]: [
    'MAPK', 'kinase', 'phosphatase', 'transcription factor', 'channel',
    'transporter', 'receptor', 'enzyme'
  ],
  [EntityType.SIGNALING_MOLECULE]: [
    'calcium', 'Ca2+', 'ROS', 'NO', 'nitric oxide', 'reactive oxygen species',
    'H2O2', 'hydrogen peroxide', 'cAMP', 'cGMP', 'IP3', 'DAG'
  ]
};

// Dictionary of relation patterns for simplified extraction
const relationPatterns = [
  {
    pattern: /(\w+)\s+(affects|regulates|influences|controls|modulates|mediates)\s+(\w+)/i,
    type: RelationType.AFFECTS
  },
  {
    pattern: /(\w+)\s+(inhibits|blocks|prevents|suppresses|reduces)\s+(\w+)/i,
    type: RelationType.INHIBITS
  },
  {
    pattern: /(\w+)\s+(activates|induces|promotes|enhances|increases|stimulates)\s+(\w+)/i,
    type: RelationType.ACTIVATES
  },
  {
    pattern: /(\w+)\s+(is\s+associated\s+with|correlates\s+with|is\s+linked\s+to)\s+(\w+)/i,
    type: RelationType.ASSOCIATED_WITH
  },
  {
    pattern: /(\w+)\s+(is\s+part\s+of|belongs\s+to|is\s+a\s+component\s+of)\s+(\w+)/i,
    type: RelationType.PART_OF
  },
  {
    pattern: /(\w+)\s+(causes|leads\s+to|results\s+in|triggers)\s+(\w+)/i,
    type: RelationType.CAUSES
  },
  {
    pattern: /(\w+)\s+(responds\s+to|is\s+responsive\s+to|is\s+activated\s+by)\s+(\w+)/i,
    type: RelationType.RESPONDS_TO
  }
];

/**
 * Process an abstract to extract entities and relations
 */
export async function processAbstract(abstractId: number, abstractText: string): Promise<{
  entities: Entity[],
  relations: Relation[]
}> {
  const extractedEntities: Entity[] = [];
  const extractedRelations: Relation[] = [];
  
  // Extract entities
  const entities = await extractEntities(abstractId, abstractText);
  
  // Store entities in database
  for (const entity of entities) {
    const entityId = await addEntity({
      name: entity.name,
      type: entity.type,
      abstractId
    });
    
    extractedEntities.push({
      id: entityId,
      name: entity.name,
      type: entity.type,
      abstractId
    });
  }
  
  // Extract relations between entities
  if (extractedEntities.length > 1) {
    const relations = await extractRelations(abstractId, abstractText, extractedEntities);
    
    // Store relations in database
    for (const relation of relations) {
      const relationId = await addRelation({
        sourceEntityId: relation.sourceEntityId,
        targetEntityId: relation.targetEntityId,
        type: relation.type,
        abstractId
      });
      
      extractedRelations.push({
        id: relationId,
        sourceEntityId: relation.sourceEntityId,
        targetEntityId: relation.targetEntityId,
        type: relation.type,
        abstractId
      });
    }
  }
  
  return {
    entities: extractedEntities,
    relations: extractedRelations
  };
}

/**
 * Extract entities from abstract text
 */
async function extractEntities(abstractId: number, text: string): Promise<{ name: string, type: string }[]> {
  const entities: { name: string, type: string }[] = [];
  const lowercaseText = text.toLowerCase();
  
  // Search for entities from the dictionary
  for (const [type, terms] of Object.entries(entityDictionary)) {
    for (const term of terms) {
      if (lowercaseText.includes(term.toLowerCase())) {
        // Add entity if not already added
        if (!entities.some(e => e.name === term)) {
          entities.push({ name: term, type });
        }
      }
    }
  }
  
  return entities;
}

/**
 * Extract relations between entities in abstract text
 */
async function extractRelations(
  abstractId: number,
  text: string,
  entities: Entity[]
): Promise<Omit<Relation, 'id'>[]> {
  const relations: Omit<Relation, 'id'>[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // For each sentence, find relations between entities
  for (const sentence of sentences) {
    // Check for each entity pair
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < entities.length; j++) {
        if (i !== j) {
          const sourceEntity = entities[i];
          const targetEntity = entities[j];
          
          // Skip if both entities are not in this sentence
          if (!sentence.toLowerCase().includes(sourceEntity.name.toLowerCase()) || 
              !sentence.toLowerCase().includes(targetEntity.name.toLowerCase())) {
            continue;
          }
          
          // Check for relation patterns
          for (const { pattern, type } of relationPatterns) {
            if (pattern.test(sentence)) {
              // Add relation if not already added
              if (!relations.some(r => 
                r.sourceEntityId === sourceEntity.id && 
                r.targetEntityId === targetEntity.id && 
                r.type === type
              )) {
                relations.push({
                  sourceEntityId: sourceEntity.id,
                  targetEntityId: targetEntity.id,
                  type,
                  abstractId
                });
                
                // Only add one relation per entity pair per sentence
                break;
              }
            }
          }
        }
      }
    }
  }
  
  return relations;
}

/**
 * Determine if a hypothesis is supported by the literature
 */
export function isHypothesisSupported(
  hypothesis: string,
  abstracts: { id: number, text: string }[]
): { isSupported: boolean, supportingAbstractIds: number[] } {
  const supportingAbstractIds: number[] = [];
  
  // Simple string matching for the hackathon implementation
  for (const abstract of abstracts) {
    if (abstract.text.toLowerCase().includes(hypothesis.toLowerCase())) {
      supportingAbstractIds.push(abstract.id);
    }
  }
  
  return {
    isSupported: supportingAbstractIds.length > 0,
    supportingAbstractIds
  };
}

export default {
  processAbstract,
  isHypothesisSupported,
  EntityType,
  RelationType
};