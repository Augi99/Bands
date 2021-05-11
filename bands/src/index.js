const express = require('express');
const crud = express();
crud.use(express.json());

const DBUser = 'mongodb+srv://Lemmy:Kilmister@bands.rr41v.mongodb.net/Bands?retryWrites=true&w=majority';
const mongoose = require('mongoose');
mongoose.connect(DBUser, {useNewUrlParser : true, useUnifiedTopology : true})
    .then((result) => startListening())
    .catch((error) => console.log(error));


const br = require('./bands');
const bandsRoute = br.bandsRoute;
crud.use('/bands',bandsRoute);

function startListening()
{
    const port = process.env.PORT || 80;
    crud.listen(port, () => console.log(`Listening on port ${port}`));
}