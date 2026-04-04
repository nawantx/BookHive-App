const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database('./books.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      year TEXT,
      img TEXT
    )
  `);
});

app.get('/api/bookmarks', (req, res) => {
  db.all('SELECT * FROM bookmarks', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to get bookmarks' });
    }
    res.json(rows);
  });
});

app.post('/api/bookmarks', (req, res) => {
  const { id, title, author, year, img } = req.body;

  if (!id || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT OR IGNORE INTO bookmarks (id, title, author, year, img) VALUES (?, ?, ?, ?, ?)',
    [id, title, author, year, img],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save bookmark' });
      }
      res.json({ message: 'Bookmark saved' });
    }
  );
});

app.put('/api/bookmarks/:id', (req, res) => {
  const id = req.params.id;
  const { title, author, year, img } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'UPDATE bookmarks SET title = ?, author = ?, year = ?, img = ? WHERE id = ?',
    [title, author, year, img, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update bookmark' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }

      res.json({ message: 'Bookmark updated' });
    }
  );
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM bookmarks WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete bookmark' });
    }
    res.json({ message: 'Bookmark deleted' });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});