# FilmLibrary API

This back-end provides a set of APIs to manage a FilmLibrary. The data is stored in an SQLite database.

## APIs

### Get all films

* **GET** /api/films
* Description: Get the full list of films.
* Request body: None
* Response: `200 OK` (success)
* Response body: Array of objects, each describing one film.

```json
[
  { "id": 1, "title": "Pulp Fiction", "favorite": 1, "watchDate": "2023-03-11", "rating": null },
  ...
]
```

* Error responses: `500 Internal Server Error` (generic error)

### Get all favorite films

* **GET** /api/films?filter=favorite
* Description: Get the list of favorite films.
* Request body: None
* Response: `200 OK` (success)
* Response body: Array of objects, each describing one film.

```json
[
  { "id": 1, "title": "Pulp Fiction", "favorite": 1, "watchDate": "2023-03-11", "rating": null },
  ...
]
```

* Error responses: `500 Internal Server Error` (generic error)

### Get all best films

* **GET** /api/films?filter=best
* Description: Get the list of best films (rating = 5).
* Request body: None
* Response: `200 OK` (success)
* Response body: Array of objects, each describing one film.

```json
[
  { "id": 1, "title": "Pulp Fiction", "favorite": 1, "watchDate": "2023-03-11", "rating": 5 },
  ...
]
```

* Error responses: `500 Internal Server Error` (generic error)

### Get films watched in the last month

* **GET** /api/films?filter=lastmonth
* Description: Get the list of films watched in the last 30 days.
* Request body: None
* Response: `200 OK` (success)
* Response body: Array of objects, each describing one film.

```json
[
  { "id": 1, "title": "Pulp Fiction", "favorite": 1, "watchDate": "2023-03-11", "rating": null },
  ...
]
```

* Error responses: `500 Internal Server Error` (generic error)

### Get unseen films

* **GET** /api/films?filter=unseen
* Description: Get the list of unseen films (watchDate is null).
* Request body: None
* Response: `200 OK` (success)
* Response body: Array of objects, each describing one film.

```json
[
  { "id": 1, "title": "Pulp Fiction", "favorite": 1, "watchDate": null, "rating": null },
  ...
]
```

* Error responses: `500 Internal Server Error` (generic error)

### Get a film by ID

* **GET** /api/films/:id
* Description: Get a film by its ID.
* Request body: None
* Response: `200 OK` (success)
* Response body: An object describing the film.

```json
{ "id": 1, "title": "Pulp Fiction", "favorite": 1, "watchDate": "2023-03-11", "rating": null }
```

* Error responses: `404 Not Found` (film not found), `500 Internal Server Error` (generic error)

### Create a new film

* **POST** /api/films
* Description: Create a new film.
* Request body: An object representing the film (without the ID).

```json
{
  "title": "Guardians of the Galaxy Vol.3",
  "favorite": 1,
  "watchDate": "2024-02-09",
  "rating": 4
}
```

* Response: `201 Created` (success)
* Response body: The ID of the newly created film.

```json
{ "id": 2 }
```

* Error responses: `500 Internal Server Error` (generic error)

### Mark a film as favorite/unfavorite

* **PUT** /api/films/:id/favorite
* Description: Mark a film as favorite or unfavorite.
* Request body: An object with the favorite status.

```json
{ "favorite": 1 }
```

* Response: `200 OK` (success)
* Error responses: `404 Not Found` (film not found), `500 Internal Server Error` (generic error)

### Change the rating of a film

* **PUT** /api/films/:id/rating
* Description: Change the rating of a film by a delta value.
* Request body: An object with the delta value.

```json
{ "delta": 1 }
```

* Response: `200 OK` (success)
* Error responses: `404 Not Found` (film not found or rating is null), `500 Internal Server Error` (generic error)

### Delete a film

* **DELETE** /api/films/:id
* Description: Delete a film by its ID.
* Request body: None
* Response: `204 No Content` (success)
* Error responses: `404 Not Found` (film not found), `500 Internal Server Error` (generic error)

### Update a film

* **PUT** /api/films/:id
* Description: Update an existing film.
* Request body: An object representing the updated film.

```json
{
  "title": "Guardians of the Galaxy Vol.3",
  "favorite": 1,
  "watchDate": "2024-02-09",
  "rating": 5
}
```

* Response: `200 OK` (success)
* Error responses: `404 Not Found` (film not found), `500 Internal Server Error` (generic error)
