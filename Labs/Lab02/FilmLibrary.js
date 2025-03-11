"use strict";

// Import libraries:
// dayjs is used to handle and format dates easily,
// and sqlite3 is used to interact with a SQLite database.
const dayjs = require('dayjs');
const sqlite3 = require('sqlite3').verbose();

// Constructor function for Film objects.
// Each Film has an id, title, a boolean favorite flag, a watchDate, and a score.
function Film(id, title, favorite = false, watchDate = undefined, score = undefined) {
    this.id = id;                      // Unique identifier for the film.
    this.title = title;                // The film's title.
    this.favorite = favorite;          // Boolean flag to mark as favorite.
    // If a watch date is provided, convert it to a dayjs object for date manipulation; otherwise undefined.
    this.watchDate = watchDate ? dayjs(watchDate) : undefined;
    this.score = score;                // Optional rating score.
}

// Constructor function for FilmLibrary.
// It maintains a local array of films and provides methods to interact with both local data and a SQLite database.
function FilmLibrary() {
    this.films = [];  // Local array to store Film objects.
    
    // Create a connection to the SQLite database 'films.db'.
    const db = new sqlite3.Database('films.db');

    // Synchronous method: Adds a Film object to the local films array.
    this.addNewFilm = function(film) {
        this.films.push(film);
    };
    
    // Synchronous method: Prints all films stored in the local films array or a provided array of films.
    this.print = function(films = this.films) {
        console.log("\nID  | Title                                      | Favorite | Watch Date | Rating");
        console.log("----|--------------------------------------------|----------|------------|-------");
        for (const film of films) {
            console.log(
                `${film.id.toString().padEnd(3)} | ${film.title.padEnd(42)} | ${film.favorite.toString().padEnd(8)} | ${film.watchDate ? film.watchDate.format('YYYY-MM-DD') : 'N/A'.padEnd(10)} | ${film.score !== null ? film.score.toString().padEnd(5) : 'N/A'.padEnd(5)}`
            );
        }
    };

    // Synchronous method: Sorts films by their watch date.
    // Films with a defined watch date are sorted, then films without a date are appended.
    this.sortByDate = function() {
        return this.films
            .filter(film => film.watchDate)           // Filter films that have a watch date.
            .sort((a, b) => a.watchDate - b.watchDate)  // Sort these films by the watch date.
            .concat(this.films.filter(film => !film.watchDate));  // Append films with no watch date.
    };

    // Synchronous method: Deletes a film from the local array by filtering out the film with the given id.
    this.deleteFilm = function(id) {
        this.films = this.films.filter(film => film.id !== id);
    };

    // Synchronous method: Resets the watch date of every film in the local array to undefined.
    this.resetWatchedFilms = function() {
        for (const film of this.films)
            film.watchDate = undefined;
    };

    // Synchronous method: Retrieves films with an assigned score and sorts them descending by score.
    this.getRated = function() {
        return this.films
            .filter(film => film.score !== undefined) // Get only films that have a score.
            .sort((a, b) => b.score - a.score);         // Sort films so that higher scores come first.
    };

    /* =================================================================
       Asynchronous Methods: These methods interact with the database.
       They use Promises to handle asynchronous operations because the database
       calls (like db.all and db.run) are non-blocking.
       
       Using the async keyword on a function means:
         - The function automatically returns a Promise.
         - You can use the await keyword inside it to pause execution until another promise resolves.
         
       Using Promises means:
         - We encapsulate asynchronous behavior.
         - When an asynchronous operation (e.g., a database query) finishes, we either resolve or reject the Promise.
       ================================================================= */

    //=================================================================
    // Asynchronous method to retrieve all films from the database.
    // The async keyword indicates that this function returns a Promise.
    // Inside, we wrap the SQLite query in a new Promise.
    this.getAllFilms = async function() {
        const sql = 'SELECT * FROM films';  // SQL command to select all films.
        return new Promise((resolve, reject) => {
            // db.all runs the SQL query asynchronously.
            // It calls the provided callback with an error (if any) and the rows returned.
            db.all(sql, [], (err, rows) => {
                if (err) {
                    // If there is an error, reject the Promise so the caller can handle it.
                    reject(err);
                    return;
                }
                // Map each row from the database into a Film object.
                const films = rows.map(row => new Film(row.id, row.title, row.favorite, row.watchdate, row.rating));
                // Resolve the Promise with the films array.
                resolve(films);
            });
        });
        // When using this method, the caller can use 'await' to wait until this Promise resolves.
    };

    //=================================================================
    // Asynchronous method to retrieve all favorite films from the database.
    this.getFavoriteFilms = async function() {
        const sql = 'SELECT * FROM films WHERE favorite = 1';  // SQL to select films marked as favorite.
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) {
                    // Reject on error.
                    reject(err);
                    return;
                }
                // Map each database row into a Film object.
                const films = rows.map(row => new Film(row.id, row.title, row.favorite, row.watchdate, row.rating));
                // Resolve with the array of favorite films.
                resolve(films);
            });
        });
    };

    //=================================================================
    // Asynchronous method to retrieve films watched today.
    this.getFilmsWatchedToday = async function() {
        // Get today's date in 'YYYY-MM-DD' format using dayjs.
        const today = dayjs().format('YYYY-MM-DD');
        const sql = 'SELECT * FROM films WHERE watchdate = ?';  // SQL query using a parameter.
        return new Promise((resolve, reject) => {
            // Pass today's date as a parameter to the SQL query.
            db.all(sql, [today], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                // Convert database rows to Film objects.
                const films = rows.map(row => new Film(row.id, row.title, row.favorite, row.watchdate, row.rating));
                resolve(films);
            });
        });
    };

    //=================================================================
    // Asynchronous method to retrieve films watched before a given date.
    this.getFilmsWatchedBefore = async function(date) {
        const sql = 'SELECT * FROM films WHERE watchdate < ?';  // SQL query to select films watched before 'date'.
        return new Promise((resolve, reject) => {
            // The provided 'date' parameter is used to filter films.
            db.all(sql, [date], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                const films = rows.map(row => new Film(row.id, row.title, row.favorite, row.watchdate, row.rating));
                resolve(films);
            });
        });
    };

    //=================================================================
    // Asynchronous method to retrieve films with a rating greater than or equal to a given value.
    this.getFilmsWithRating = async function(rating) {
        const sql = 'SELECT * FROM films WHERE rating >= ?';  // SQL query with a parameter for rating.
        return new Promise((resolve, reject) => {
            db.all(sql, [rating], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                // Each returned row is transformed into a Film object.
                const films = rows.map(row => new Film(row.id, row.title, row.favorite, row.watchdate, row.rating));
                resolve(films);
            });
        });
    };

    //=================================================================
    // Asynchronous method to retrieve films whose title contains a specific substring.
    this.getFilmsByTitle = async function(title) {
        const sql = 'SELECT * FROM films WHERE title LIKE ?';  // SQL query using LIKE for pattern matching.
        return new Promise((resolve, reject) => {
            // Using '%' wildcards allows matching any sequence of characters before and after the given title substring.
            db.all(sql, [`%${title}%`], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                const films = rows.map(row => new Film(row.id, row.title, row.favorite, row.watchdate, row.rating));
                resolve(films);
            });
        });
    };

    //=================================================================
    // Asynchronous method to store a new film into the database.
    this.storeFilm = async function(film) {
        // SQL INSERT command to add a film.
        const sql = 'INSERT INTO films (title, favorite, watchdate, rating) VALUES (?, ?, ?, ?)';
        return new Promise((resolve, reject) => {
            // db.run executes the INSERT command. Notice that it uses a function callback
            // so we can access properties like 'this.lastID' that indicate the newly inserted row's id.
            db.run(sql, [film.title, film.favorite, film.watchDate ? film.watchDate.format('YYYY-MM-DD') : null, film.score], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                // Resolve the promise with a success message, using this.lastID to show the generated id.
                resolve(`\nFilm with ID ${this.lastID} added successfully.`);
            });
        });
    };

    //=================================================================
    // Asynchronous method to delete a film from the database by its id.
    this.deleteFilmFromDB = async function(id) {
        const sql = 'DELETE FROM films WHERE id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(`\nFilm with ID ${id} deleted successfully.`);
            });
        });
    };

    //=================================================================
    // Asynchronous method to reset (remove) the watch dates of all films in the database.
    this.resetWatchDatesInDB = async function() {
        const sql = 'UPDATE films SET watchdate = NULL';
        return new Promise((resolve, reject) => {
            db.run(sql, [], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve('\nWatch dates reset successfully.');
            });
        });
    };
}

/* ======================================================
   Example Usage:
   We wrap our operations in an immediately invoked async function expression
   This allows us to use await to pause execution until each asynchronous database operation is complete.
   
   The use of await:
   - It ensures that the function waits for the promise (returned by an async method) to resolve,
     meaning that the data is available before moving on to the next instruction.
   - This simplifies handling asynchronous operations without using explicit .then() callbacks.

   ======================================================== */

// Test methods
(async () => {
    const myLibrary = new FilmLibrary();
    try {
        // Await pauses execution until getAllFilms completes its asynchronous operation.
        // This way, 'allFilms' contains the array of Film objects retrieved from the database.
        const allFilms = await myLibrary.getAllFilms();
        console.log("\n***** All Films *****");
        myLibrary.print(allFilms);

        // Similarly, await ensures that favorite films are fetched and available before logging.
        const favoriteFilms = await myLibrary.getFavoriteFilms();
        console.log("\n***** Favorite Films *****");
        myLibrary.print(favoriteFilms);

        // Wait for the asynchronous operation to fetch films watched today.
        const filmsWatchedToday = await myLibrary.getFilmsWatchedToday();
        console.log("\n***** Films Watched Today *****");
        myLibrary.print(filmsWatchedToday);

        // Await for films watched before a certain date (here, '2023-03-15') to be retrieved.
        const filmsWatchedBefore = await myLibrary.getFilmsWatchedBefore('2023-03-15');
        console.log("\n***** Films Watched Before 2023-03-15 *****");
        myLibrary.print(filmsWatchedBefore);

        // Wait for films with a rating of 4 or higher.
        const filmsWithRating = await myLibrary.getFilmsWithRating(4);
        console.log("\n***** Films with Rating >= 4 *****");
        myLibrary.print(filmsWithRating);

        // Wait for films whose titles contain the string 'Star'.
        const filmsWithTitle = await myLibrary.getFilmsByTitle('Star');
        console.log("\n***** Films with Title containing 'Star' *****");
        myLibrary.print(filmsWithTitle);

        // Store a new film in the database. The operation is asynchronous,
        // and await ensures that we wait for the insertion to complete before moving on.
        const storeMessage = await myLibrary.storeFilm(new Film(null, 'Intersetllar', true, '2025-03-11', 5));
        console.log(storeMessage);

        // Delete a film with a specific id from the database.
        const deleteMessage = await myLibrary.deleteFilmFromDB(1);
        console.log(deleteMessage);

        // Reset the watch dates in the database for all films.
        const resetMessage = await myLibrary.resetWatchDatesInDB();
        console.log(resetMessage);

    } catch (err) {
        console.error(err);
    }
})();
