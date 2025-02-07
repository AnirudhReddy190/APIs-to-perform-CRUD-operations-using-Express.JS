const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is Running')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}

initializeDbServer()

const convertMovieToResponse = movie => ({
  movieName: movie.movie_name,
})

const convertMovieDetailsToResponse = movie => ({
  movieId: movie.movie_id,
  directorId: movie.director_id,
  movieName: movie.movie_name,
  leadActor: movie.lead_actor,
})

// **API 1: Get all movie names**
app.get('/movies/', async (request, response) => {
  const query = `SELECT movie_name FROM movie;`
  const movies = await db.all(query)
  response.send(movies.map(convertMovieToResponse))
})

// **API 2: Add a new movie**
app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const query = `
    INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (?, ?, ?);`

  await db.run(query, [directorId, movieName, leadActor])
  response.send('Movie Successfully Added')
})

// **API 3: Get movie details by movieId**
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const query = `SELECT * FROM movie WHERE movie_id = ?;`
  const movie = await db.get(query, [movieId])

  if (movie) {
    response.send(convertMovieDetailsToResponse(movie))
  } else {
    response.status(404).send({error: 'Movie Not Found'})
  }
})

// **API 4: Update a movie**
app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body

  const query = `
    UPDATE movie 
    SET director_id = ?, movie_name = ?, lead_actor = ? 
    WHERE movie_id = ?;`

  const result = await db.run(query, [
    directorId,
    movieName,
    leadActor,
    movieId,
  ])

  if (result.changes > 0) {
    response.send('Movie Details Updated')
  } else {
    response.status(404).send({error: 'Movie Not Found'})
  }
})

// **API 5: Delete a movie**
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const query = `DELETE FROM movie WHERE movie_id = ?;`

  const result = await db.run(query, [movieId])

  if (result.changes > 0) {
    response.send('Movie Removed')
  } else {
    response.status(404).send({error: 'Movie Not Found'})
  }
})

// **API 6: Get all directors**
app.get('/directors/', async (request, response) => {
  const query = `SELECT * FROM director;`
  const directors = await db.all(query)

  response.send(
    directors.map(director => ({
      directorId: director.director_id,
      directorName: director.director_name,
    })),
  )
})

// **API 7: Get movies directed by a specific director**
app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const query = `SELECT movie_name FROM movie WHERE director_id = ?;`
  const movies = await db.all(query, [directorId])

  response.send(movies.map(convertMovieToResponse))
})

// Export the express app as a module (required)
module.exports = app
