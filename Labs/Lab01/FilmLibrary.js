"use strict";  

const dayjs = require('dayjs');

// Film constructor function
class Film {
    constructor(id, title, favorite = false, watchDate = null, score = null) {
        this.id = id;
        this.title = title;
        this.favorite = favorite;
        this.watchDate = watchDate ? dayjs(watchDate) : null;
        this.score = score;
    }
}

// FilmLibrary constructor function
class FilmLibrary {
    constructor() {
        this.films = [];
    }

    addNewFilm(film) {
        this.films.push(film);
    }

    print() {
        console.log("\nID  | Title                                      | Favorite | Watch Date | Rating");
        console.log("----|--------------------------------------------|----------|------------|-------");
        this.films.forEach(film => {
            console.log(
                `${film.id.toString().padEnd(3)} | ${film.title.padEnd(42)} | ${film.favorite.toString().padEnd(8)} | ${film.watchDate ? film.watchDate.format('YYYY-MM-DD') : 'N/A'.padEnd(10)} | ${film.score !== null ? film.score.toString().padEnd(5) : 'N/A'.padEnd(5)}`
            );
        });
    }

    sortByDate() {
        return this.films.slice().sort((a, b) => {
            if (!a.watchDate) return 1;
            if (!b.watchDate) return -1;
            return a.watchDate.diff(b.watchDate);
        });
    }

    deleteFilm(id) {
        this.films = this.films.filter(film => film.id !== id);
    }

    resetWatchedFilms() {
        this.films.forEach(film => film.watchDate = null);
    }

    getRated() {
        return this.films.filter(film => film.score !== null)
            .sort((a, b) => b.score - a.score);
    }
}

// Populate FilmLibrary
const films = [
    new Film(1, "Pulp Fiction", true, "2023-03-10", 5),
    new Film(2, "21 Grams", true, "2023-03-17", 4),
    new Film(3, "Star Wars"),
    new Film(4, "Matrix"),
    new Film(5, "Shrek", false, "2023-03-21", 3),
    new Film(6, "The Dark Knight", true, "2025-03-05", 5),
    new Film(7, "Fight Club", false, "2025-03-10", 4),
    new Film(8, "Forrest Gump", true, "2025-03-15", 5),
    new Film(9, "The Shawshank Redemption", false, "2025-03-20", 5),
    new Film(10, "Inception", true, "2025-03-25", 5)
];

const myLibrary = new FilmLibrary();
films.forEach(film => myLibrary.addNewFilm(film));

// Test methods
myLibrary.print();
console.log("\nSorted by date:");
myLibrary.sortByDate().forEach(film => console.log(film));

console.log("\nDeleting film with Id 3");
myLibrary.deleteFilm(3);
myLibrary.print();

console.log("\nResetting watched films");
myLibrary.resetWatchedFilms();
myLibrary.print();

console.log("\nRated films:");
myLibrary.getRated().forEach(film => console.log(film));