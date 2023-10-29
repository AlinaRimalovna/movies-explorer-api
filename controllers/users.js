const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ValidationError = require('../errors/ValidationError');
const CastError = require('../errors/CastError');
const NotFoundError = require('../errors/NotFoundError');
const Conflict = require('../errors/Conflict');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.createUser = (req, res, next) => {
  const { name } = req.body;
  bcrypt.hash(req.body.password, 10)
    .then((hash) => User.create({
      name,
      email: req.body.email,
      password: hash,
    }))
    .then((user) => {
      const payload = { _id: user._id, email: user.email };
      const token = jwt.sign(payload, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');
      res
        .cookie('jwt', token, {
          maxAge: 3600000 * 24 * 7,
          httpOnly: true,
          sameSite: true,
        });
      return res.send({ _id: user._id, email: user.email });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные при создании пользователя'));
        return;
      } if (err.code === 11000) {
        next(new Conflict(' Пользователь с таким email уже существует'));
        return;
      }
      next(err);
    });
};

module.exports.updateUser = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })
    .orFail(new NotFoundError('Пользователь по данному Id не найден'))
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные при обновлении пользователя'));
        return;
      } if (err.message === 'DocumentNotFoundError') {
        next(new NotFoundError('Пользователь по данному Id не найден'));
        return;
      }
      next(err);
    });
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  User.findUserByCredentials(email, password)
    .then((user) => {
      const payload = { _id: user._id, email: user.email };
      const token = jwt.sign(payload, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');
      res
        .cookie('jwt', token, {
          maxAge: 3600000 * 24 * 7,
          httpOnly: true,
          sameSite: true,
        });
      return res.send({ _id: user._id, email: user.email });
    })
    .catch(next);
};

module.exports.getUserInfo = (req, res, next) => {
  const userId = req.user;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь по данному Id не найден');
      }
      res.send({ name: user.name, email: user.email, id: user._id });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new CastError('Переданы некорректные данные при поиске пользователя'));
        return;
      }
      next(err);
    });
};

module.exports.signOut = (req, res) => res.clearCookie('jwt').status(200).send({ message: 'До скорой встречи!' });
