const router = require('express').Router();
const mongoose = require('mongoose');
const Picture = mongoose.model('Picture');

// return a list of tags
router.get('/', function(req, res, next) {
    Picture.find().distinct('tagList').then(function(tags){
        return res.json({tags: tags});
    }).catch(next);
});

module.exports = router;
