const dayjs = require('dayjs');

"use strict";

function Film(id, title, favorite, watchDate, rating) {
    this.id = id;
    this.title = title;
    this.favorite = favorite;
    this.watchDate = watchDate ? dayjs(watchDate) : undefined;
    this.rating = rating;
}

function FilmLibrary() {
    this.films = [];

    this.addNewFilm = function(film) {
        this.films.push(film);
    };

    this.print = function() {
        console.log("\nID  | Title                                      | Favorite | Watch Date | Rating");
        console.log("----|--------------------------------------------|----------|------------|-------");
        this.films.forEach(film => {
            console.log(
                `${film.id.toString().padEnd(3)} | ${film.title.padEnd(42)} | ${film.favorite.toString().padEnd(8)} | ${film.watchDate ? film.watchDate.format('YYYY-MM-DD') : 'N/A'.padEnd(10)} | ${film.rating !== undefined ? film.rating.toString().padEnd(5) : 'N/A'.padEnd(5)}`
            );
        });
    };

    this.sortByDate = function() {
        return this.films
            .filter(film => film.watchDate) // Filter out films without a watch date
            .sort((a, b) => a.watchDate - b.watchDate) // Sort by watch date
            .concat(this.films.filter(film => !film.watchDate)); // Append films without a watch date at the end
    };

    this.deleteFilm = function(id) {
        console.log(`Deleting film with ID: ${id}`);
        this.films = this.films.filter(film => film.id !== id);
    };

    this.resetWatchedFilms = function() {
        console.log("Resetting watch dates for all films");
        this.films.forEach(film => {
            film.watchDate = undefined;
        });
    };

    this.getRated = function() {
        const ratedFilms = this.films
            .filter(film => film.rating !== undefined)
            .sort((a, b) => b.rating - a.rating);

        console.log("\n***** Films filtered, only the rated ones *****");
        ratedFilms.forEach(film => {
            console.log(`Id: ${film.id}, Title: ${film.title}, Favorite: ${film.favorite}, Watch date: ${film.watchDate ? film.watchDate.format('MMMM DD, YYYY') : 'N/A'}, Score: ${film.rating}`);
        });

        return ratedFilms;
    };
}

const films = [
    { id: 1, title: "Pulp Fiction", favorite: true, watchDate: "2023-03-10", rating: 5 },
    { id: 2, title: "21 Grams", favorite: true, watchDate: "2023-03-17", rating: 4 },
    { id: 3, title: "Star Wars", favorite: false, watchDate: undefined, rating: undefined },
    { id: 4, title: "Matrix", favorite: false, watchDate: undefined, rating: undefined },
    { id: 5, title: "Shrek", favorite: false, watchDate: "2023-03-21", rating: 3 },
    { id: 6, title: "The Dark Knight", favorite: true, watchDate: "2025-03-05", rating: 5 },
    { id: 7, title: "Fight Club", favorite: false, watchDate: "2025-03-10", rating: 4 },
    { id: 8, title: "Forrest Gump", favorite: true, watchDate: "2025-03-15", rating: 5 },
    { id: 9, title: "The Shawshank Redemption", favorite: false, watchDate: "2025-03-20", rating: 5 },
    { id: 10, title: "Inception", favorite: true, watchDate: "2025-03-25", rating: 5 }
];

const filmLibrary = new FilmLibrary();

films.forEach(filmData => {
    const film = new Film(filmData.id, filmData.title, filmData.favorite, filmData.watchDate, filmData.rating);
    filmLibrary.addNewFilm(film);
});

filmLibrary.print();

// Test the sortByDate method
const sortedFilms = filmLibrary.sortByDate();
console.log("\nSorted Films by Watch Date:");
sortedFilms.forEach(film => {
    console.log(
        `${film.id.toString().padEnd(3)} | ${film.title.padEnd(42)} | ${film.favorite.toString().padEnd(8)} | ${film.watchDate ? film.watchDate.format('YYYY-MM-DD') : 'N/A'.padEnd(10)} | ${film.rating !== undefined ? film.rating.toString().padEnd(5) : 'N/A'.padEnd(5)}`
    );
});

// Test the deleteFilm method
filmLibrary.deleteFilm(3);
console.log("\nAfter deleting film with ID 3:");
filmLibrary.print();

// Test the resetWatchedFilms method
filmLibrary.resetWatchedFilms();
console.log("\nAfter resetting watch dates:");
filmLibrary.print();

// Test the getRated method
filmLibrary.getRated();