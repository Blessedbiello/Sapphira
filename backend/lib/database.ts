// import sqlite3 from 'sqlite3';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { promisify } from 'util';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const dbPath = path.join(__dirname, '../../data/saphira.db');

// export interface Abstract {
//   id: number;
//   title: string;
//   text: string;
//   publicationDate: string;
//   doi: string;
// }

// export interface Entity {
//   id: number;
//   text: string;
//   type: string;
//   abstractId: number;
// }

// export interface Relation {
//   id: number;
//   sourceId: number;
//   targetId: number;
//   type: string;
//   abstractId: number;
// }

// export interface Hypothesis {
//   id: number;
//   text: string;
//   complexity: number;
//   isSupported: boolean;
// }

// /**
//  * Initialize SQLite database
//  */
// export function initDatabase() {
//   const db = new sqlite3.Database(dbPath, (err) => {
//     if (err) {
//       console.error('Error opening database:', err);
//       throw err;
//     }
//   });

//   // Promisify database methods
//   const dbRun = promisify(db.run.bind(db));
//   const dbGet = promisify(db.get.bind(db));
//   const dbAll = promisify(db.all.bind(db));

//   // Create tables
//   db.serialize(() => {
//     db.run(`
//       CREATE TABLE IF NOT EXISTS abstracts (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         title TEXT,
//         text TEXT,
//         publicationDate TEXT,
//         doi TEXT
//       )
//     `);

//     db.run(`
//       CREATE TABLE IF NOT EXISTS entities (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         text TEXT,
//         type TEXT,
//         abstractId INTEGER,
//         FOREIGN KEY (abstractId) REFERENCES abstracts(id)
//       )
//     `);

//     db.run(`
//       CREATE TABLE IF NOT EXISTS relations (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         sourceId INTEGER,
//         targetId INTEGER,
//         type TEXT,
//         abstractId INTEGER,
//         FOREIGN KEY (sourceId) REFERENCES entities(id),
//         FOREIGN KEY (targetId) REFERENCES entities(id),
//         FOREIGN KEY (abstractId) REFERENCES abstracts(id)
//       )
//     `);

//     db.run(`
//       CREATE TABLE IF NOT EXISTS hypotheses (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         text TEXT,
//         complexity INTEGER,
//         isSupported BOOLEAN
//       )
//     `);

//     db.run(`
//       CREATE TABLE IF NOT EXISTS hypothesis_abstracts (
//         hypothesisId INTEGER,
//         abstractId INTEGER,
//         FOREIGN KEY (hypothesisId) REFERENCES hypotheses(id),
//         FOREIGN KEY (abstractId) REFERENCES abstracts(id),
//         PRIMARY KEY (hypothesisId, abstractId)
//       )
//     `);
//   });

//   return {
//     run: dbRun,
//     get: dbGet,
//     all: dbAll,
//     close: promisify(db.close.bind(db)),
//   };
// }

// /**
//  * Add an abstract to the database
//  */
// export async function addAbstract(abstract: Omit<Abstract, 'id'>): Promise<number> {
//   const db = initDatabase();
//   try {
//     const result = await db.run(
//       'INSERT INTO abstracts (title, text, publicationDate, doi) VALUES (?, ?, ?, ?)',
//       [abstract.title, abstract.text, abstract.publicationDate, abstract.doi]
//     );
//     return result.lastID!;
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Get an abstract by ID
//  */
// export async function getAbstract(id: number): Promise<Abstract | undefined> {
//   const db = initDatabase();
//   try {
//     return await db.get('SELECT * FROM abstracts WHERE id = ?', [id]);
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Get all abstracts
//  */
// export async function getAllAbstracts(): Promise<Abstract[]> {
//   const db = initDatabase();
//   try {
//     return await db.all('SELECT * FROM abstracts');
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Add an entity to the database
//  */
// export async function addEntity(entity: Omit<Entity, 'id'>): Promise<number> {
//   const db = initDatabase();
//   try {
//     const result = await db.run(
//       'INSERT INTO entities (text, type, abstractId) VALUES (?, ?, ?)',
//       [entity.text, entity.type, entity.abstractId]
//     );
//     return result.lastID!;
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Add a relation to the database
//  */
// export async function addRelation(relation: Omit<Relation, 'id'>): Promise<number> {
//   const db = initDatabase();
//   try {
//     const result = await db.run(
//       'INSERT INTO relations (sourceId, targetId, type, abstractId) VALUES (?, ?, ?, ?)',
//       [relation.sourceId, relation.targetId, relation.type, relation.abstractId]
//     );
//     return result.lastID!;
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Add a hypothesis to the database
//  */
// export async function addHypothesis(
//   hypothesis: Omit<Hypothesis, 'id'>,
//   supportingAbstractIds: number[]
// ): Promise<number> {
//   const db = initDatabase();
//   try {
//     // Start a transaction
//     await db.run('BEGIN TRANSACTION');

//     // Insert hypothesis
//     const result = await db.run(
//       'INSERT INTO hypotheses (text, complexity, isSupported) VALUES (?, ?, ?)',
//       [hypothesis.text, hypothesis.complexity, hypothesis.isSupported]
//     );
//     const hypothesisId = result.lastID!;

//     // Insert supporting abstracts
//     for (const abstractId of supportingAbstractIds) {
//       await db.run(
//         'INSERT INTO hypothesis_abstracts (hypothesisId, abstractId) VALUES (?, ?)',
//         [hypothesisId, abstractId]
//       );
//     }

//     // Commit transaction
//     await db.run('COMMIT');
//     return hypothesisId;
//   } catch (error) {
//     await db.run('ROLLBACK');
//     throw error;
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Get hypotheses by complexity
//  */
// export async function getHypothesesByComplexity(complexity: number): Promise<Hypothesis[]> {
//   const db = initDatabase();
//   try {
//     return await db.all('SELECT * FROM hypotheses WHERE complexity = ?', [complexity]);
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Get percolation data
//  */
// export async function getPercolationData(): Promise<{ complexity: number; supportRate: number }[]> {
//   const db = initDatabase();
//   try {
//     const data = await db.all(`
//       SELECT complexity, 
//              CAST(SUM(CASE WHEN isSupported THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) AS supportRate
//       FROM hypotheses
//       GROUP BY complexity
//     `);
//     return data;
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Get all entities
//  */
// export async function getAllEntities(): Promise<Entity[]> {
//   const db = initDatabase();
//   try {
//     return await db.all('SELECT * FROM entities');
//   } finally {
//     await db.close();
//   }
// }

// /**
//  * Process an abstract (stub for NLP processing)
//  */
// export async function processAbstract(abstractId: number, text: string): Promise<void> {
//   // This is a stub; actual implementation is in nlp.ts
//   console.log(`Processing abstract ${abstractId} (stub)`);
// }


import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Abstract {
  id: number;
  title: string;
  text: string;
  publicationDate: string;
  doi?: string;
}

export interface Entity {
  id: number;
  name: string; // Changed from 'text' to 'name' for consistency
  type: string;
  abstractId: number;
}

export interface Relation {
  id: number;
  sourceEntityId: number; // Changed from 'sourceId' for clarity
  targetEntityId: number; // Changed from 'targetId' for clarity
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

export interface SearchFilters {
  entityType?: string;
  relationType?: string;
  complexity?: number;
  isSupported?: boolean;
  dateRange?: { start: string; end: string };
}

interface DatabaseConnection {
  run: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  get: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void>;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private dbPath: string;

  private constructor() {
    this.dbPath = path.join(__dirname, '../../data/saphira.db');
    this.ensureDataDirectory();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private createConnection(): Promise<DatabaseConnection> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Enable foreign key constraints
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            reject(err);
            return;
          }

          const connection: DatabaseConnection = {
            run: promisify(db.run.bind(db)),
            get: promisify(db.get.bind(db)),
            all: promisify(db.all.bind(db)),
            close: promisify(db.close.bind(db)),
            beginTransaction: () => promisify(db.run.bind(db))('BEGIN TRANSACTION') as Promise<void>,
            commit: () => promisify(db.run.bind(db))('COMMIT') as Promise<void>,
            rollback: () => promisify(db.run.bind(db))('ROLLBACK') as Promise<void>
          };

          resolve(connection);
        });
      });
    });
  }

  public async withConnection<T>(operation: (db: DatabaseConnection) => Promise<T>): Promise<T> {
    const db = await this.createConnection();
    try {
      return await operation(db);
    } finally {
      await db.close();
    }
  }

  public async withTransaction<T>(operation: (db: DatabaseConnection) => Promise<T>): Promise<T> {
    const db = await this.createConnection();
    try {
      await db.beginTransaction();
      const result = await operation(db);
      await db.commit();
      return result;
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      await db.close();
    }
  }
}

const dbManager = DatabaseManager.getInstance();

/**
 * Initialize SQLite database with enhanced schema
 */
export async function initDatabase(): Promise<void> {
  await dbManager.withConnection(async (db) => {
    await db.run(`
      CREATE TABLE IF NOT EXISTS abstracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        text TEXT NOT NULL,
        publicationDate TEXT NOT NULL,
        doi TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        abstractId INTEGER NOT NULL,
        confidence REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (abstractId) REFERENCES abstracts(id) ON DELETE CASCADE,
        UNIQUE(name, type, abstractId)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceEntityId INTEGER NOT NULL,
        targetEntityId INTEGER NOT NULL,
        type TEXT NOT NULL,
        abstractId INTEGER NOT NULL,
        confidence REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sourceEntityId) REFERENCES entities(id) ON DELETE CASCADE,
        FOREIGN KEY (targetEntityId) REFERENCES entities(id) ON DELETE CASCADE,
        FOREIGN KEY (abstractId) REFERENCES abstracts(id) ON DELETE CASCADE,
        CHECK (sourceEntityId != targetEntityId)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS hypotheses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL UNIQUE,
        complexity INTEGER NOT NULL CHECK (complexity >= 1),
        isSupported BOOLEAN NOT NULL,
        confidence REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS hypothesis_support (
        hypothesisId INTEGER NOT NULL,
        abstractId INTEGER NOT NULL,
        strength REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (hypothesisId, abstractId),
        FOREIGN KEY (hypothesisId) REFERENCES hypotheses(id) ON DELETE CASCADE,
        FOREIGN KEY (abstractId) REFERENCES abstracts(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_entities_abstract_id ON entities(abstractId)',
      'CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)',
      'CREATE INDEX IF NOT EXISTS idx_relations_abstract_id ON relations(abstractId)',
      'CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(sourceEntityId)',
      'CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(targetEntityId)',
      'CREATE INDEX IF NOT EXISTS idx_hypotheses_complexity ON hypotheses(complexity)',
      'CREATE INDEX IF NOT EXISTS idx_abstracts_date ON abstracts(publicationDate)',
      'CREATE INDEX IF NOT EXISTS idx_abstracts_doi ON abstracts(doi)'
    ];

    for (const indexSql of indexes) {
      await db.run(indexSql);
    }

    // Create triggers for timestamp updates
    await db.run(`
      CREATE TRIGGER IF NOT EXISTS update_abstracts_timestamp 
        AFTER UPDATE ON abstracts
      BEGIN
        UPDATE abstracts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    await db.run(`
      CREATE TRIGGER IF NOT EXISTS update_hypotheses_timestamp 
        AFTER UPDATE ON hypotheses
      BEGIN
        UPDATE hypotheses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
  });
}

/**
 * Add an abstract to the database with duplicate detection
 */
export async function addAbstract(abstract: Omit<Abstract, 'id'>): Promise<number> {
  return await dbManager.withConnection(async (db) => {
    // Check for duplicate DOI if provided
    if (abstract.doi) {
      const existing = await db.get('SELECT id FROM abstracts WHERE doi = ?', [abstract.doi]);
      if (existing) {
        throw new Error(`Abstract with DOI ${abstract.doi} already exists`);
      }
    }

    const result = await db.run(
      'INSERT INTO abstracts (title, text, publicationDate, doi) VALUES (?, ?, ?, ?)',
      [abstract.title, abstract.text, abstract.publicationDate, abstract.doi || null]
    );
    return result.lastID!;
  });
}

/**
 * Update an existing abstract
 */
export async function updateAbstract(id: number, updates: Partial<Omit<Abstract, 'id'>>): Promise<boolean> {
  return await dbManager.withConnection(async (db) => {
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.text !== undefined) {
      fields.push('text = ?');
      values.push(updates.text);
    }
    if (updates.publicationDate !== undefined) {
      fields.push('publicationDate = ?');
      values.push(updates.publicationDate);
    }
    if (updates.doi !== undefined) {
      fields.push('doi = ?');
      values.push(updates.doi);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.run(`UPDATE abstracts SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.changes! > 0;
  });
}

/**
 * Delete an abstract and all related data
 */
export async function deleteAbstract(id: number): Promise<boolean> {
  return await dbManager.withConnection(async (db) => {
    const result = await db.run('DELETE FROM abstracts WHERE id = ?', [id]);
    return result.changes! > 0;
  });
}

/**
 * Get an abstract by ID
 */
export async function getAbstract(id: number): Promise<Abstract | undefined> {
  return await dbManager.withConnection(async (db) => {
    const row = await db.get('SELECT * FROM abstracts WHERE id = ?', [id]);
    if (!row) return undefined;

    return {
      id: row.id,
      title: row.title,
      text: row.text,
      publicationDate: row.publicationDate,
      doi: row.doi
    };
  });
}

/**
 * Search abstracts with filters
 */
export async function searchAbstracts(query?: string, filters?: SearchFilters): Promise<Abstract[]> {
  return await dbManager.withConnection(async (db) => {
    let sql = 'SELECT DISTINCT a.* FROM abstracts a';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters?.entityType || filters?.relationType) {
      sql += ' JOIN entities e ON a.id = e.abstractId';
      if (filters.relationType) {
        sql += ' JOIN relations r ON a.id = r.abstractId';
      }
    }

    if (query) {
      conditions.push('(a.title LIKE ? OR a.text LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }

    if (filters?.entityType) {
      conditions.push('e.type = ?');
      params.push(filters.entityType);
    }

    if (filters?.relationType) {
      conditions.push('r.type = ?');
      params.push(filters.relationType);
    }

    if (filters?.dateRange) {
      conditions.push('a.publicationDate BETWEEN ? AND ?');
      params.push(filters.dateRange.start, filters.dateRange.end);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY a.publicationDate DESC';

    const rows = await db.all(sql, params);
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      text: row.text,
      publicationDate: row.publicationDate,
      doi: row.doi
    }));
  });
}

/**
 * Get all abstracts
 */
export async function getAllAbstracts(): Promise<Abstract[]> {
  return await dbManager.withConnection(async (db) => {
    const rows = await db.all('SELECT * FROM abstracts ORDER BY publicationDate DESC');
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      text: row.text,
      publicationDate: row.publicationDate,
      doi: row.doi
    }));
  });
}

/**
 * Add an entity to the database with duplicate detection
 */
export async function addEntity(entity: Omit<Entity, 'id'>, confidence = 1.0): Promise<number> {
  return await dbManager.withConnection(async (db) => {
    try {
      const result = await db.run(
        'INSERT INTO entities (name, type, abstractId, confidence) VALUES (?, ?, ?, ?)',
        [entity.name, entity.type, entity.abstractId, confidence]
      );
      return result.lastID!;
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        // Entity already exists, get its ID
        const existing = await db.get(
          'SELECT id FROM entities WHERE name = ? AND type = ? AND abstractId = ?',
          [entity.name, entity.type, entity.abstractId]
        );
        return existing.id;
      }
      throw error;
    }
  });
}

/**
 * Get all entities for an abstract
 */
export async function getEntitiesForAbstract(abstractId: number): Promise<Entity[]> {
  return await dbManager.withConnection(async (db) => {
    const rows = await db.all(
      'SELECT * FROM entities WHERE abstractId = ? ORDER BY type, name',
      [abstractId]
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      abstractId: row.abstractId
    }));
  });
}

/**
 * Add a relation to the database
 */
export async function addRelation(relation: Omit<Relation, 'id'>, confidence = 1.0): Promise<number> {
  return await dbManager.withConnection(async (db) => {
    const result = await db.run(
      'INSERT INTO relations (sourceEntityId, targetEntityId, type, abstractId, confidence) VALUES (?, ?, ?, ?, ?)',
      [relation.sourceEntityId, relation.targetEntityId, relation.type, relation.abstractId, confidence]
    );
    return result.lastID!;
  });
}

/**
 * Get all relations for an abstract with entity details
 */
export async function getRelationsForAbstract(abstractId: number): Promise<(Relation & {
  sourceName: string;
  targetName: string;
})[]> {
  return await dbManager.withConnection(async (db) => {
    const rows = await db.all(`
      SELECT r.*, 
             e1.name as sourceName,
             e2.name as targetName
      FROM relations r
      JOIN entities e1 ON r.sourceEntityId = e1.id
      JOIN entities e2 ON r.targetEntityId = e2.id
      WHERE r.abstractId = ?
      ORDER BY r.type, e1.name
    `, [abstractId]);

    return rows.map(row => ({
      id: row.id,
      sourceEntityId: row.sourceEntityId,
      targetEntityId: row.targetEntityId,
      type: row.type,
      abstractId: row.abstractId,
      sourceName: row.sourceName,
      targetName: row.targetName
    }));
  });
}

/**
 * Add a hypothesis to the database with transaction support
 */
export async function addHypothesis(
  hypothesis: Omit<Hypothesis, 'id'>,
  supportingAbstractIds: number[] = [],
  confidence = 1.0
): Promise<number> {
  return await dbManager.withTransaction(async (db) => {
    try {
      // Insert hypothesis
      const result = await db.run(
        'INSERT INTO hypotheses (text, complexity, isSupported, confidence) VALUES (?, ?, ?, ?)',
        [hypothesis.text, hypothesis.complexity, hypothesis.isSupported, confidence]
      );
      const hypothesisId = result.lastID!;

      // Insert supporting abstracts
      for (const abstractId of supportingAbstractIds) {
        await db.run(
          'INSERT INTO hypothesis_support (hypothesisId, abstractId, strength) VALUES (?, ?, ?)',
          [hypothesisId, abstractId, 1.0]
        );
      }

      return hypothesisId;
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Hypothesis with this text already exists');
      }
      throw error;
    }
  });
}

/**
 * Get hypotheses by complexity with supporting abstracts
 */
export async function getHypothesesByComplexity(complexity: number): Promise<Hypothesis[]> {
  return await dbManager.withConnection(async (db) => {
    const rows = await db.all(`
      SELECT h.*, GROUP_CONCAT(hs.abstractId) as supportingAbstracts
      FROM hypotheses h
      LEFT JOIN hypothesis_support hs ON h.id = hs.hypothesisId
      WHERE h.complexity = ?
      GROUP BY h.id
      ORDER BY h.confidence DESC, h.created_at DESC
    `, [complexity]);

    return rows.map(row => {
      const supportingAbstractIds = row.supportingAbstracts
        ? row.supportingAbstracts.split(',').map(Number)
        : [];

      return {
        id: row.id,
        text: row.text,
        complexity: row.complexity,
        isSupported: Boolean(row.isSupported),
        supportingAbstractIds: supportingAbstractIds.length > 0 ? supportingAbstractIds : undefined
      };
    });
  });
}

/**
 * Get percolation data with enhanced statistics
 */
export async function getPercolationData(): Promise<{ 
  complexity: number; 
  supportRate: number; 
  totalCount: number; 
}[]> {
  return await dbManager.withConnection(async (db) => {
    const rows = await db.all(`
      SELECT complexity, 
             COUNT(*) as totalCount,
             ROUND(CAST(SUM(CASE WHEN isSupported THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as supportRate
      FROM hypotheses
      GROUP BY complexity
      ORDER BY complexity
    `);

    return rows.map(row => ({
      complexity: row.complexity,
      supportRate: row.supportRate,
      totalCount: row.totalCount
    }));
  });
}

/**
 * Get all entities with usage statistics
 */
export async function getAllEntities(): Promise<{
  id: number;
  name: string;
  type: string;
  usageCount: number;
}[]> {
  return await dbManager.withConnection(async (db) => {
    const rows = await db.all(`
      SELECT e.id, e.name, e.type, COUNT(*) as usageCount
      FROM entities e
      GROUP BY e.name, e.type
      ORDER BY usageCount DESC, e.type, e.name
    `);

    return rows;
  });
}

/**
 * Get comprehensive database statistics
 */
export async function getDatabaseStats(): Promise<{
  abstracts: number;
  entities: number;
  relations: number;
  hypotheses: number;
  entityTypes: string[];
  relationTypes: string[];
}> {
  return await dbManager.withConnection(async (db) => {
    const [abstractCount, entityCount, relationCount, hypothesisCount] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM abstracts'),
      db.get('SELECT COUNT(*) as count FROM entities'),
      db.get('SELECT COUNT(*) as count FROM relations'),
      db.get('SELECT COUNT(*) as count FROM hypotheses')
    ]);

    const [entityTypes, relationTypes] = await Promise.all([
      db.all('SELECT DISTINCT type FROM entities ORDER BY type'),
      db.all('SELECT DISTINCT type FROM relations ORDER BY type')
    ]);

    return {
      abstracts: abstractCount.count,
      entities: entityCount.count,
      relations: relationCount.count,
      hypotheses: hypothesisCount.count,
      entityTypes: entityTypes.map(row => row.type),
      relationTypes: relationTypes.map(row => row.type)
    };
  });
}

/**
 * Process an abstract (enhanced stub with error handling)
 */
export async function processAbstract(abstractId: number, text: string): Promise<void> {
  try {
    // Verify abstract exists
    const abstract = await getAbstract(abstractId);
    if (!abstract) {
      throw new Error(`Abstract with ID ${abstractId} not found`);
    }

    // This is a stub; actual implementation would be in nlp.ts
    console.log(`Processing abstract ${abstractId}: "${abstract.title.substring(0, 50)}..."`);
    console.log(`Text length: ${text.length} characters`);
    
    // Future: Call NLP processing functions here
    // await extractEntities(abstractId, text);
    // await extractRelations(abstractId, text);
  } catch (error) {
    console.error(`Error processing abstract ${abstractId}:`, error);
    throw error;
  }
}

export default {
  initDatabase,
  addAbstract,
  updateAbstract,
  deleteAbstract,
  getAbstract,
  searchAbstracts,
  getAllAbstracts,
  addEntity,
  getEntitiesForAbstract,
  addRelation,
  getRelationsForAbstract,
  addHypothesis,
  getHypothesesByComplexity,
  getPercolationData,
  getAllEntities,
  getDatabaseStats,
  processAbstract
};