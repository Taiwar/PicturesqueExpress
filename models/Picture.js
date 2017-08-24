const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');
const User = mongoose.model('User');

const PictureSchema = new mongoose.Schema({
    slug: {type: String, lowercase: true, unique: true},
    title: String,
    description: String,
    image: String,
    isLocal: {type: Boolean, default: false},
    tagList: [{type: String}],
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, {timestamps: true});

PictureSchema.plugin(uniqueValidator, {message: 'is already taken'});

PictureSchema.pre('validate', function(next){
    if(!this.slug)  {
        this.slugify();
    }

    next();
});

PictureSchema.methods.slugify = function() {
    this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

PictureSchema.methods.toJSON = function() {
    return {
        slug: this.slug,
        title: this.title,
        description: this.description,
        image: this.image,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tagList: this.tagList,
        author: this.author.username
    };
};

mongoose.model('Picture', PictureSchema);
