const Joi = require('joi');

class Validator{
    constructor()
    {
        this.BandSchema = {
            _id : Joi.any(),
            id : Joi.number().integer().min(1).required(),
            name : Joi.string().required(),
            genre : Joi.string().required(),
            nationality : Joi.string().required(),
            songIds : Joi.array()
        };
    }

    validateBand(band){
        return Joi.validate(band, this.BandSchema);
    }
}

exports.validator = Validator;