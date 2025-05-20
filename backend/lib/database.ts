import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define types
export interface Abstract {
  id: number;
  title: string;
  text: string;
  publicationDate: string;
  doi?: string;
}

export interface Entity {
  id: number;
  name: string;
  type: string;
  abstractId: number;
}

export interface Relation {
  id: number;
  sourceEntityId: number;
  targetEntityId: number;
  type: string;
  abstractId: number;
}

export interface Hypothesis {
  id: number;
  text: string;
  complexity: number;
  isSupported: boolean;
  supportingAbstractIds?: number[];
}

let db: Database.Database;

/**
 * Initialize the SQLite database with required tables
 */
export function initDatabase(): Database.Database {
  const dbPath = path.join(__dirname, '../../data/saphira.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new Database(dbPath);
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS abstracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      publication_date TEXT NOT NULL,
      doi TEXT
    );

    CREATE TABLE IF NOT EXISTS entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      abstract_id INTEGER NOT NULL,
      FOREIGN KEY (abstract_id) REFERENCES abstracts(id)
    );

    CREATE TABLE IF NOT EXISTS relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_entity_id INTEGER NOT NULL,
      target_entity_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      abstract_id INTEGER NOT NULL,
      FOREIGN KEY (source_entity_id) REFERENCES entities(id),
      FOREIGN KEY (target_entity_id) REFERENCES entities(id),
      FOREIGN KEY (abstract_id) REFERENCES abstracts(id)
    );

    CREATE TABLE IF NOT EXISTS hypotheses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      complexity INTEGER NOT NULL,
      is_supported BOOLEAN NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hypothesis_support (
      hypothesis_id INTEGER NOT NULL,
      abstract_id INTEGER NOT NULL,
      PRIMARY KEY (hypothesis_id, abstract_id),
      FOREIGN KEY (hypothesis_id) REFERENCES hypotheses(id),
      FOREIGN KEY (abstract_id) REFERENCES abstracts(id)
    );
  `);
  
  return db;
}

/**
 * Add an abstract to the database
 */
export function addAbstract(abstract: Omit<Abstract, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO abstracts (title, text, publication_date, doi)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    abstract.title,
    abstract.text,
    abstract.publicationDate,
    abstract.doi || null
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Get an abstract by ID
 */
export function getAbstract(id: number): Abstract | undefined {
  const stmt = db.prepare('SELECT * FROM abstracts WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    publicationDate: row.publication_date,
    doi: row.doi
  };
}

/**
 * Get all abstracts
 */
export function getAllAbstracts(): Abstract[] {
  const stmt = db.prepare('SELECT * FROM abstracts');
  const rows = stmt.all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    text: row.text,
    publicationDate: row.publication_date,
    doi: row.doi
  }));
}

/**
 * Add an entity to the database
 */
export function addEntity(entity: Omit<Entity, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO entities (name, type, abstract_id)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(
    entity.name,
    entity.type,
    entity.abstractId
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Get all entities for an abstract
 */
export function getEntitiesForAbstract(abstractId: number): Entity[] {
  const stmt = db.prepare('SELECT * FROM entities WHERE abstract_id = ?');
  const rows = stmt.all(abstractId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    abstractId: row.abstract_id
  }));
}

/**
 * Add a relation to the database
 */
export function addRelation(relation: Omit<Relation, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO relations (source_entity_id, target_entity_id, type, abstract_id)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    relation.sourceEntityId,
    relation.targetEntityId,
    relation.type,
    relation.abstractId
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Get all relations for an abstract
 */
export function getRelationsForAbstract(abstractId: number): Relation[] {
  const stmt = db.prepare('SELECT * FROM relations WHERE abstract_id = ?');
  const rows = stmt.all(abstractId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    sourceEntityId: row.source_entity_id,
    targetEntityId: row.target_entity_id,
    type: row.type,
    abstractId: row.abstract_id
  }));
}

/**
 * Add a hypothesis to the database
 */
export function addHypothesis(hypothesis: Omit<Hypothesis, 'id'>, supportingAbstractIds?: number[]): number {
  const stmt = db.prepare(`
    INSERT INTO hypotheses (text, complexity, is_supported)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(
    hypothesis.text,
    hypothesis.complexity,
    hypothesis.isSupported ? 1 : 0
  );
  
  const hypothesisId = result.lastInsertRowid as number;
  
  // Add supporting abstracts if provided
  if (supportingAbstractIds && supportingAbstractIds.length > 0) {
    const supportStmt = db.prepare(`
      INSERT INTO hypothesis_support (hypothesis_id, abstract_id)
      VALUES (?, ?)
    `);
    
    const insertSupport = db.transaction((abstractIds: number[]) => {
      for (const abstractId of abstractIds) {
        supportStmt.run(hypothesisId, abstractId);
      }
    });
    
    insertSupport(supportingAbstractIds);
  }
  
  return hypothesisId;
}

/**
 * Get all hypotheses with a specific complexity
 */
export function getHypothesesByComplexity(complexity: number): Hypothesis[] {
  const stmt = db.prepare(`
    SELECT h.*, GROUP_CONCAT(hs.abstract_id) as supporting_abstracts
    FROM hypotheses h
    LEFT JOIN hypothesis_support hs ON h.id = hs.hypothesis_id
    WHERE h.complexity = ?
    GROUP BY h.id
  `);
  
  const rows = stmt.all(complexity) as any[];
  
  return rows.map(row => {
    const supportingAbstractIds = row.supporting_abstracts
      ? row.supporting_abstracts.split(',').map(Number)
      : [];
      
    return {
      id: row.id,
      text: row.text,
      complexity: row.complexity,
      isSupported: Boolean(row.is_supported),
      supportingAbstractIds: supportingAbstractIds.length > 0 ? supportingAbstractIds : undefined
    };
  });
}

/**
 * Get support rate for each complexity level
 */
export function getPercolationData(): { complexity: number, supportRate: number }[] {
  const stmt = db.prepare(`
    SELECT complexity, 
           ROUND(SUM(CASE WHEN is_supported = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as support_rate
    FROM hypotheses
    GROUP BY complexity
    ORDER BY complexity
  `);
  
  const rows = stmt.all() as any[];
  
  return rows.map(row => ({
    complexity: row.complexity,
    supportRate: row.support_rate
  }));
}

/**
 * Get all distinct entities in the database
 */
export function getAllEntities(): { id: number, name: string, type: string }[] {
  const stmt = db.prepare(`
    SELECT DISTINCT id, name, type
    FROM entities
    ORDER BY name
  `);
  
  return stmt.all() as any[];
}

export default {
  initDatabase,
  addAbstract,
  getAbstract,
  getAllAbstracts,
  addEntity,
  getEntitiesForAbstract,
  addRelation,
  getRelationsForAbstract,
  addHypothesis,
  getHypothesesByComplexity,
  getPercolationData,
  getAllEntities
};