const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  createMovie, findAllMovies, deleteMovie,
} = require('../controllers/movies');

const Reg = /^(https?:\/\/)?([\w-]{1,32}\.[\w-]{1,32})[^\s@]*$/;

router.post('/', celebrate({
  body: Joi.object().keys({
    country: Joi.string().required(),
    director: Joi.string().required(),
    duration: Joi.number().required(),
    year: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string().required().pattern(Reg),
    trailerLink: Joi.string().required().pattern(Reg),
    thumbnail: Joi.string().required().pattern(Reg),
    movieId: Joi.string().required(),
    nameRU: Joi.string().required(),
    nameEN: Joi.string().required(),
  }),
}), createMovie);
router.get('/', findAllMovies);
router.delete('/:movieId', celebrate({
  params: Joi.object().keys({
    movieId: Joi.string().hex().required().length(24),
  }),
}), deleteMovie);

module.exports = router;
