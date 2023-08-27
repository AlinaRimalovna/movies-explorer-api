const Movie = require('../models/movie');
const ValidationError = require('../errors/ValidationError');
const CastError = require('../errors/CastError');
const NotFoundError = require('../errors/NotFoundError');
const Forbidden = require('../errors/Forbidden');

const SUCCESS_CODE = 201;

module.exports.createMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
  } = req.body;
  const owner = req.user._id;
  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
    owner,
  })
    .then((movie) => res.status(SUCCESS_CODE).send(movie))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные при создании фильма'));
        return;
      }
      next(err);
    });
};
module.exports.findAllMovies = (req, res, next) => {
  Movie.find(
    { owner: req.user._id },
  )
    .then((movie) => res.status(200).send(movie))
    .catch(next);
};

module.exports.deleteMovie = (req, res, next) => {
  Movie.findById(req.params.movieId)
    .orFail(new NotFoundError('Фильм по данному Id не найдена'))
    .then((movie) => {
      if (String(movie.owner) === String(req.user._id)) {
        Movie.deleteOne(movie)
          .then((deleteMovie) => res.status(200).send(deleteMovie))
          .catch((err) => {
            if (err.name === 'CastError') {
              next(new CastError('Переданы некорректные данные при удалении фильма'));
              return;
            }
            next(err);
          });
      } else {
        next(new Forbidden('Недостаточно прав для удаления фильма'));
      }
    })
    .catch(next);
};
