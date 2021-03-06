const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bandSchema = new Schema({ 
    id: Number,
    name : String,
    genre: String,
    nationality : String,
    songIds : [Number]
});

const Band = mongoose.model('Band', bandSchema);
exports.Band = Band; 