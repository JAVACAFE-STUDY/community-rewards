var multer = require('multer');
var fs= require('fs');
var gm = require('gm');
var Thumbnail = require('thumbnail');
var httpStatus = require('http-status');
var APIError = require('../helpers/APIError');
var User = require('../models/user.model');
var config = require('../config/config');
var profileImagePath = config.imageUploadPath
var profileThumbnailImagePath = config.imageThumbnailUploadPath
var thumbnail = new Thumbnail(profileImagePath,  profileThumbnailImagePath);

/* Create root user */
User.list()
    .then(users => {
      if (users.length < 1) {
        const user = new User({
          email: config.root.id,
          name: config.root.id,
          status: 'active',
          role: config.root.role,
          keyStore: JSON.parse(config.root.keyStore)
        });
        
        user.save()
          .then(savedUser => console.info(savedUser))
          .catch(e => console.error);
      }
    })
    .catch(e => console.error);

function activeList(req, res) {
  User.find({status: 'active'}).select({ "email": 2, "name": 1, "_id": 0})
    .then(user => res.json(user))
    .catch(e => next(e));;
}

function addressList(req, res) {
  var array = req.query.selected.split(',');
  User.find({ email: array })
    .then(user => {
      res.json(user);
    })
    .catch(e => next(e));
}

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  if(id === 'me') {
    id = req.decoded._id
  }

  User.get(id)
    .then((user) => {
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.json(req.user);
}

/**
 * Create new user
 * @property {string} req.body.name - The name of user.
 * @property {string} req.body.email - The email of user.
 * @returns {User}
 */
function create(req, res, next) {
  const user = new User({
    email: req.body.email,
    role: req.body.role,
    status: req.body.status
  });

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch((e) => {
      next(new APIError(e.message, httpStatus.BAD_REQUEST));
    });
}

/**
 * Update existing user
 * @property {string} req.body.email - The email of user.
 * @returns {User}
 */
function update(req, res, next) {
  const user = new User(req.user);
  if (req.body.name != '') {
    user.name = req.body.name;
  }
  if (req.body.role != '') {
    user.role = req.body.role;
  }

  if (req.body.status != '') {
    user.status = req.body.status;
  }

  User.update({_id: user.id}, user)
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  var q = {}
  if(req.query.status) {
    q.status = req.query.status
  }
  User.list({ limit, skip, q })
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Delete user.
 * @returns {User}
 */
function remove(req, res, next) {
  const user = req.user;
  user.remove()
    .then(deletedUser => res.json(deletedUser))
    .catch(e => next(e));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(profileImagePath)){
      fs.mkdirSync(profileImagePath);
    }

    if (!fs.existsSync(profileThumbnailImagePath)){
      fs.mkdirSync(profileThumbnailImagePath);
    }

    cb(null, profileImagePath);
  },
  filename: (req, file, cb) => {
    const fileName = "profile_" + file.originalname + ".jpg";
    cb(null, fileName);
    thumbnail.ensureThumbnail(fileName, 50, 50, function(err, filename){
      if (err) {
        console.error(err);
      }
    });
  }
});

const upload = multer({
  storage: storage
}).single('profile');

function uploadImage(req, res, next) {
  upload(req, res, err => {
    if (err) {
      res.json({"result" : "Fail" })
    } else {
      res.json({"result" : "Success" })
    }
  });
}

module.exports = { load, get, create, update, list, remove, activeList, addressList, uploadImage };