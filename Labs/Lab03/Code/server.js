"use strict";

/*====================================================================*/
/*====================================================================*/
// Import Express & SQLite, set up Day.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

/*====================================================================*/
/*====================================================================*/
// Create Express app, define port
const app = express();
const port = 3001;

// Enable JSON request body parsing
app.use(express.json());

// Open a connection to the SQLite database
const db = new sqlite3.Database('../Database/films.db');

/*====================================================================*/
/*====================================================================*/
// Get all films, possibly filtered by a query parameter (e.g. ?filter=best)
app.get('/api/films', (req, res) => {
    const filter = req.query.filter;
    let sql = 'SELECT * FROM films';
    let params = [];

    // Check filter parameter and adjust SQL accordingly
    // Default query is to retrieve all films
    // If a filter is provided, adjust the query to filter the films
    if (filter) {
        switch (filter) {
            case 'favorite':
                sql += ' WHERE favorite = 1'; // Only favorite films
                break;
            case 'best':
                sql += ' WHERE rating = 5'; // Only highest-rated films
                break;
            case 'lastmonth':
                // Retrieve films watched in the last 30 days
                sql += ' WHERE watchdate BETWEEN ? AND ?';
                params = [
                  dayjs().subtract(30, 'day').format('YYYY-MM-DD'), 
                  dayjs().format('YYYY-MM-DD')
                ];
                break;
            case 'unseen':
                // Films with no watch date
                sql += ' WHERE watchdate IS NULL';
                break;
            default:
                // No recognized filter, keep the default query
                break;
        }
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Return the filtered (or all) films
        res.json(rows);
    });
});

/*====================================================================*/
/*====================================================================*/
// Get a single film by its ID from the database
app.get('/api/films/:id', (req, res) => {
    const sql = 'SELECT * FROM films WHERE id = ?';
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Film not found' });
            return;
        }
        res.json(row);
    });
});

/*====================================================================*/
/*====================================================================*/
// Insert a new film into the database
app.post('/api/films', (req, res) => {
    const { title, favorite, watchDate, rating } = req.body;
    // watchDate is converted into YYYY-MM-DD format if provided, else null
    const sql = 'INSERT INTO films (title, favorite, watchdate, rating) VALUES (?, ?, ?, ?)';
    const params = [
      title, 
      favorite, 
      watchDate ? dayjs(watchDate).format('YYYY-MM-DD') : null, 
      rating
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Return the newly inserted ID along with the posted data
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});

/*====================================================================*/
/*====================================================================*/
// Update the 'favorite' status of a film
app.put('/api/films/:id/favorite', (req, res) => {
    const { favorite } = req.body;
    const sql = 'UPDATE films SET favorite = ? WHERE id = ?';
    const params = [favorite, req.params.id];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // this.changes indicates how many rows were affected
        if (this.changes === 0) {
            res.status(404).json({ error: 'Film not found' });
            return;
        }
        res.json({ id: req.params.id, favorite });
    });
});

/*====================================================================*/
/*====================================================================*/
// Change the rating of a film by adding a "delta" value
app.put('/api/films/:id/rating', (req, res) => {
    const { delta } = req.body;
    // Only update if rating is not null
    const sql = 'UPDATE films SET rating = rating + ? WHERE id = ? AND rating IS NOT NULL';
    const params = [delta, req.params.id];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // If no rows changed, the film might not exist or rating is null
        if (this.changes === 0) {
            res.status(404).json({ error: 'Film not found or rating is null' });
            return;
        }
        res.json({ id: req.params.id, delta });
    });
});

/*====================================================================*/
/*====================================================================*/
// Delete a film from the database
app.delete('/api/films/:id', (req, res) => {
    const sql = 'DELETE FROM films WHERE id = ?';
    const params = [req.params.id];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // If no rows changed, the film didn't exist
        if (this.changes === 0) {
            res.status(404).json({ error: 'Film not found' });
            return;
        }
        res.json({ message: `Film with ID ${req.params.id} deleted successfully.` });
    });
});

/*====================================================================*/
/*====================================================================*/
// Update a film's basic details
app.put('/api/films/:id', (req, res) => {
    const { title, favorite, watchDate, rating } = req.body;
    const sql = 'UPDATE films SET title = ?, favorite = ?, watchdate = ?, rating = ? WHERE id = ?';
    const params = [
      title, 
      favorite, 
      watchDate ? dayjs(watchDate).format('YYYY-MM-DD') : null, 
      rating, 
      req.params.id
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Film not found' });
            return;
        }
        res.json({ id: req.params.id, ...req.body });
    });
});

/*====================================================================*/
/*====================================================================*/
// Start the server running on the defined port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

/*====================================================================*/
/*====================================================================*/