'use strict';

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');                                  // logging middleware
const { check, validationResult, body, param, query } = require('express-validator'); // validation middleware

const filmDao = require('./dao-films'); // module for accessing the films table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());


/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};


/*** Films APIs ***/

// 1. Retrieve the list of all the available films.
// GET /api/films
// This route also handles "filter=?" (optional) query parameter, accessed via  req.query.filter
app.get('/api/films', 
  [
    query('filter').optional().isIn(['favorite', 'best', 'lastmonth', 'unseen', 'all'])
  ],
  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    // get films that match optional filter in the query
    filmDao.listFilms(req.query.filter)
      .then(films => res.json(films))
      .catch((err) => res.status(500).json(err)); // always return a json and an error message
  }
);

// 2. Retrieve a film, given its “id”.
// GET /api/films/<id>
// Given a film id, this route returns the associated film from the library.
app.get('/api/films/:id',
  [ param('id').isInt({min: 1}) ],    // check: is the id an integer, and is it a positive integer?
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }
    try {
      const result = await filmDao.getFilm(req.params.id);
      if (result.error)   // If not found, the function returns a resolved promise with an object where the "error" field is set
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).end();
    }
  }
);


// 3. Create a new film, by providing all relevant information.
// POST /api/films
// This route adds a new film to film library.
app.post('/api/films',
  [
    body('title').isString().notEmpty(),
    body('favorite').isBoolean(),
    // only date (first ten chars) and valid ISO e.g. 2024-02-09
    body('watchDate').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
    body('rating').isInt({min: 1, max: 5}),
  ], 
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }

    const film = {
      title: req.body.title,
      favorite: req.body.favorite,
      watchDate: req.body.watchDate,
      rating: req.body.rating,
    };

    try {
      const result = await filmDao.createFilm(film); // NOTE: createFilm returns the newly created object
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new film: ${err}` }); 
    }
  }
);

// 4. Update an existing film, by providing all the relevant information
// PUT /api/films/<id>
// This route allows to modify a film, specifiying its id and the necessary data.
app.put('/api/films/:id',
  [
    param('id').isInt({min: 1}),    // check: is the id an integer, and is it a positive integer?
    body('title').optional().isString().notEmpty(),
    body('favorite').optional().isBoolean(),
    body('watchDate').optional().isLength({min: 10, max: 10}).isISO8601({strict: true}),
    body('rating').optional().isInt({min: 1, max: 5}),
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }

    const filmId = Number(req.params.id);
    // Is the id in the body present? If yes, is it equal to the id in the url?
    if (req.body.id && req.body.id !== filmId) {
      return res.status(422).json({ error: 'URL and body id mismatch' });
    }

    try {
      const film = await filmDao.getFilm(filmId);
      if (film.error)   // If not found, the function returns a resolved promise with an object where the "error" field is set
        return res.status(404).json(film);
      const newFilm = {
        title: req.body.title || film.title,
        favorite: req.body.favorite || film.favorite,
        watchDate: req.body.watchDate || film.watchDate,
        rating: req.body.rating || film.rating,
      };
      const result = await filmDao.updateFilm(film.id, newFilm);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result); 
    } catch (err) {
      res.status(503).json({ error: `Database error during the update of film ${req.params.id}` });
    }
  }
);

// 5. Mark an existing film as favorite/unfavorite
// PUT /api/films/:id/favorite 
// This route changes only the favorite value, and it is idempotent. It could also be a PATCH method.
app.put('/api/films/:id/favorite',
  [
    param('id').isInt({min: 1}),    // check: is the id an integer, and is it a positive integer?
    body('favorite').isBoolean()
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }

    const filmId = Number(req.params.id);
    // Is the id in the body present? If yes, is it equal to the id in the url?
    if (req.body.id && req.body.id !== filmId) {
      return res.status(422).json({ error: 'URL and body id mismatch' });
    }

    try {
      const film = await filmDao.getFilm(filmId);
      if (film.error)   // If not found, the function returns a resolved promise with an object where the "error" field is set
        return res.status(404).json(film);
      film.favorite = req.body.favorite;  // update favorite property
      const result = await filmDao.updateFilm(film.id, film);
      return res.json(result); 
    } catch (err) {
      res.status(503).json({ error: `Database error during the favorite update of film ${req.params.id}` });
    }
  }
);

// 6. Change the rating of a specific film
// POST /api/films/change-rating 
// This route changes the rating value. Note that it must be a POST, not a PUT, because it is NOT idempotent.
app.post('/api/films/change-rating',
  [ // These checks will apply to the req.body part
    body('id').isInt({min: 1}),
    body('deltaRating').isInt()
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }

    try {
      /* IMPORTANT NOTE: Only for the purpose of this class, DB operations done in the SAME API
      (such as the following ones) are assumed to be performed without interference from other requests to the DB.
      In a real case a DB transaction/locking mechanisms should be used. Sqlite does not help in this regard.
      Thus querying DB with transactions can be avoided for the purpose of this class. */
      const filmId = req.body.id;
      const deltaRating = req.body.deltaRating;
      const result = await filmDao.updateFilmRating(filmId, deltaRating);
      return res.json(result); 
    } catch (err) {
      res.status(503).json({ error: `Database error during the rating update of film ${req.params.id}` });
    }
  }
);


// 7. Delete an existing film, given its "id"
// DELETE /api/films/<id>
// Given a film id, this route deletes the associated film from the library.
app.delete('/api/films/:id',
  [ param('id').isInt({min: 1}) ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    try {
      // NOTE: if there is no film with the specified id, the delete operation is considered successful.
      await filmDao.deleteFilm(req.params.id);
      res.status(200).end();  // Empty body 
    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of film ${req.params.id}: ${err} ` });
    }
  }
);


// Activating the server
const PORT = 3001;
app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}/`));
