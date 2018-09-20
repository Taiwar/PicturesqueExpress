const fs = require('fs');
const mongoose = require('mongoose');
const router = require('express').Router();
const Picture = mongoose.model('Picture');
const User = mongoose.model('User');
const auth = require('../auth');
const path = require('path');


String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

// read all pictures from folder and update db
const dropoffFolder = './public/picture_dropoff/';
const title_pattern = /[^\\]*(?=[.][a-zA-Z]+$)/;
let local_images = [];

function walkDir(dir, user, next) {
    if (!fs.statSync(dir).isDirectory()) {
        console.log("Dir", dir);
        console.log("split", dir.split(path.sep));
        const split = dir.split(path.sep);
        const categories = split.slice(2, split.length - 1);
        console.log("Cats", categories);
        const img_file = path.basename(dir);
        let img_path = 'http://localhost:3000/static/picture_dropoff/' + img_file;
        if (categories.length > 0) {
            let categories_string = "";
            categories.forEach((category) => {
                categories_string += category + "/";
            });
            img_path = 'http://localhost:3000/static/picture_dropoff/' + categories_string + img_file;
        }
        Picture.findOne({image: img_path}, function (err, obj) {
            if (!obj) {
                let picture = new Picture();
                picture.title = title_pattern.exec(img_file);
                if (path.basename(img_file) !== "picture_dropoff") {
                    let img_categories = [];
                    if (categories) {
                        img_categories = categories;
                    }
                    Array.prototype.push.apply(picture.tagList, img_categories);
                    /**img_categories.forEach(img_category => {
                        picture.title = img_category.capitalize() + " - " + picture.title;
                        picture.tagList.push(img_category);
                    });**/
                }
                picture.image = img_path;
                picture.author = user;
                picture.isLocal = true;
                picture.save().catch(next);
            }
        });
        local_images.push(img_path);

        return
    }

    fs.readdirSync(dir).map(f => walkDir(path.join(dir, f), user, next));
}

router.get('/update_folder', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if (!user) { return res.sendStatus(401); }

        walkDir(dropoffFolder, user, next);

        Picture.find({isLocal: true}, function (err, pictures) {
            pictures.forEach(function (picture) {
                if (!(local_images.indexOf(picture.image) > -1)) {
                    picture.remove();
                }
            })
        });
        return res.json({success: true});
    }).catch(next);
});

module.exports = router;