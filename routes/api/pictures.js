const router = require('express').Router();
const mongoose = require('mongoose');
const Picture = mongoose.model('Picture');
const User = mongoose.model('User');
const auth = require('../auth');

// Preload picture objects on routes with ':picture'
router.param('picture', function(req, res, next, slug) {
    Picture.findOne({slug: slug})
        .populate('picture')
        .then(function (picture) {
            if (!picture) { return res.sendStatus(404); }

            req.picture = picture;

            return next();
        }).catch(next);
});

router.get('/', auth.optional, function(req, res, next) {
    let query = {};
    let limit = 20;
    let offset = 0;

    if(typeof req.query.limit !== 'undefined'){
        limit = req.query.limit;
    }

    if(typeof req.query.offset !== 'undefined'){
        offset = req.query.offset;
    }

    if( typeof req.query.tag !== 'undefined' ){
        query.tagList = {"$in" : [req.query.tag]};
    }

    Promise.all([
        req.query.author ? User.findOne({username: req.query.author}) : null
    ]).then(function(results){
        let author = results[0];

        if(author){
            query.author = author._id;
        }

        return Promise.all([
            Picture.find(query)
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({createdAt: 'desc'})
                .populate('author')
                .exec(),
            Picture.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null
        ]).then(function(results){
            let pictures = results[0];
            let picturesCount = results[1];

            return res.json({
                pictures: pictures.map(function(picture){
                    return picture.toJSON();
                }),
                picturesCount: picturesCount
            });
        });
    }).catch(next);
});

router.post('/', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if (!user) { return res.sendStatus(401); }

        let picture = new Picture(req.body.picture);

        picture.author = user;

        return picture.save().then(function(){
            return res.json({picture: picture.toJSON()});
        });
    }).catch(next);
});

router.get('/random', auth.optional, function (req, res, next) {
    Promise.all([
        Picture.count().exec(function (err, count) {
            let random = Math.floor(Math.random() * count);

            Picture.findOne().skip(random).exec(
                function (err, result) {
                    console.log("Alright" +  result);
                    req.picture = result;
                    req.picture.populate('author').execPopulate();
                }).then(function () {
                    return res.json({picture: req.picture.toJSON()});
                }
            );

        }),
    ]).catch(next);
});


// return a picture
router.get('/:picture', auth.optional, function(req, res, next) {
    Promise.all([
        req.payload ? User.findById(req.payload.id) : null,
        req.picture.populate('author').execPopulate()
    ]).then(function(){
        return res.json({picture: req.picture.toJSON()});
    }).catch(next);
});

function parse_url(url) {
    let pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
    let matches =  url.match(pattern);
    return {
        scheme: matches[2],
        authority: matches[4],
        path: matches[5],
        query: matches[7],
        fragment: matches[9]
    };
}

// update picture
router.put('/:picture', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function() {
        if (req.picture.author.toString() === req.payload.id.toString()) {

            if (typeof req.body.picture.title !== 'undefined') {
                req.picture.title = req.body.picture.title;
            }

            if (typeof req.body.picture.description !== 'undefined') {
                req.picture.description = req.body.picture.description;
            }

            if (typeof req.body.picture.image !== 'undefined') {
                req.picture.image = req.body.picture.image;
            }

            if (typeof req.body.picture.tagList !== 'undefined') {
                req.picture.tagList = req.body.picture.tagList
            }

            req.picture.isLocal = parse_url(req.picture.image).authority === "192.168.178.33";

            req.picture.save().then(function(picture){
                return res.json({picture: picture.toJSON()});
            }).catch(next);
        } else {
            return res.sendStatus(403);
        }
    });
});

// delete picture
router.delete('/:picture', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if (!user) { return res.sendStatus(401); }

        if(req.picture.author.toString() === req.payload.id.toString()){
            return req.picture.remove().then(function(){
                return res.sendStatus(204);
            });
        } else {
            return res.sendStatus(403);
        }
    }).catch(next);
});



module.exports = router;
