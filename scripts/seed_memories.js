const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Determine DB path from env or default
const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const dbPath = dbUrl.replace('file:', '').trim();
const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, '..', dbPath);

if (!fs.existsSync(absolutePath)) {
  console.error(`Database not found at: ${absolutePath}`);
  process.exit(1);
}

const db = new Database(absolutePath);

// Read existing memory items from JSON
const jsonPath = path.join(__dirname, '..', 'src', 'data', 'memoriesGallery.json');
const memories = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const stmt = db.prepare(
  `INSERT OR IGNORE INTO MemoryItem (id, title, subtitle, description, imagePath, imageAlt, icon, sortOrder, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
);

const txn = db.transaction(() => {
  let count = 0;
  for (let i = 0; i < memories.length; i++) {
    const m = memories[i];
    const result = stmt.run(m.id, m.title, m.subtitle, m.description, '', m.imageAlt || '', m.icon || 'camera', i);
    if (result.changes > 0) count++;
  }
  return count;
});

const count = txn();
console.log(`Seeded ${count} memory items from memoriesGallery.json`);

// Verify
const total = db.prepare('SELECT COUNT(*) as count FROM MemoryItem').get();
console.log(`Total MemoryItem rows: ${total.count}`);

db.close();
