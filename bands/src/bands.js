const express = require('express');
const router = express.Router();

const BandModule = require('./Band');
const Band = BandModule.Band;

const axios = require('axios');

const va = require('./Validator');

const http = require('http');

//const { try } = require('joi/lib/types/alternatives');

const Validator = va.validator;
const validator = new Validator();


router.get('/', (req, res) =>
{
    Band.find()
    .then(result => 
    {
        if(result.length > 0)
        {
            prepareResponseArray(result, res);
        }else
        {
            res.status(404);
            res.send("No bands found");
        }
    })
    .catch(error =>
    {
        console.log(error);
        res.status(404);
        res.send("Error occurred");
    });
});

router.get('/:id', (req, res) =>
{
    Band.findOne({id : req.params.id})
    .then(result => 
    {
        if(result == null)
        {
            res.status(404);
            res.send("Not found");
            return;
        }else prepareResponse(result, res);
        
    })
    .catch(error =>
    {
        res.status(404);
        res.send("An error has occurred");
    })
});

router.post('/', (req, res) =>
{
    Band.findOne().sort({id:-1}).limit(1)
    .then(result => 
    {
        const previousId = result.toJSON().id;
        createBand(previousId + 1, req, res);
    })
    .catch(error => 
    {
        createBand(1, req, res);
    }); 
});

router.put('/:id', (req, res) =>
{
    let updatedBand = new Band(
    {
        id : req.params.id,
        name : req.body.name,
        genre : req.body.genre,
        nationality : req.body.nationality
    });

    let putBand = prepareBand(updatedBand);

    const {error} = validator.validateBand(putBand);
    if(error)
    {
        res.status(400);
        res.send("Put request must specify name, genre and nationality of the band");
        return;
    }

    Band.findOneAndReplace({id : req.params.id},putBand, null, (err, result) =>
    {
        if(result)
        {

            prepareResponse(updatedBand, res);
            
        }else
        {
            res.status(404);
            res.send("Specified id not found ");
            console.log(err);
        }
        
            
    });
});

router.delete('/:id', (req, res) => {
    Band.findOneAndDelete({id : req.params.id}, (err, result) =>
    {
        if(result)
        {
            prepareResponse(result, res);
            
            
        }else
        {
            res.status(404);
            res.send("The band did not exist");
        }
    });

});

async function prepareResponse(result, res)
{
    let response = result.toJSON();
    delete response._id;
    delete response.__v;

    let songs =  await gatherSongs(response.songIds);
    for(let i = 0; i < response.songIds.length; i++)
    {
        delete songs[i].id;
        delete songs[i].artist;
    }
    if(songs.length == 0)
    {
        response.songs = "We don't know of any of their songs";
    }else response.songs = songs;
    
    delete response.songIds;
    
    res.send(response);
}


function prepareBand(result)
{
    let response = result.toJSON();
    delete response._id;
    delete response.__v;
    delete response.songIds;
    
    return response;
}

async function prepareResponseArray(result, res)
{
    let responseArray = [];
    for(let  i = 0; i < result.length; i++)
    {
        let response = result[i].toJSON();
        response.songs = [];
        let songs =  await gatherSongs(response.songIds);
        for(let i = 0; i < response.songIds.length; i++)
        {
            delete songs[i].id;
            delete songs[i].artist;
        }

        if(songs.length == 0)
        {
            response.songs = "We don't know of any of their songs";
        }else response.songs = songs;

        delete response._id;
        delete response.__v;
        delete response.songIds;
        responseArray.push(response);

    }
    res.send(responseArray);
}

async function createBand(identificator, req, res)
{
    let newBand = new Band(
    {
        id : identificator,
        name : req.body.name,
        genre : req.body.genre,
        nationality: req.body.nationality
    });


    let {error} = validator.validateBand(newBand.toJSON());

    

    if(error)
    {
        res.status(400);
        res.send("Post request must specify name, genre and nationality of the band");
        return;
    }


    Band.findOne({name: newBand.name})
    .then(found => 
    {

        if(found)
        {
            
            res.status(400);
            res.send("Such band already exists");
            return;
        }else
        {

            if(req.body.songs)
            {
                req.body.songs.artist  = newBand.name;
                axios.post('http://songs-service:5000/songs', req.body.songs)
                .then(() => 
                {
                    newBand.save()
                    .then((result) => 
                    {
                        updateSongs();
                        res.location("http:/localhost/bands/" + newBand.id);  
                        prepareResponse(result, res);
                    })
                    .catch((err) => {
                        updateSongs();
                        console.log(err);
                        res.send("Post failed");
                    });
                });
            }
            
            
        
        
            
        }
        
    })
    .catch(err => 
    {
        res.status(400);
        res.send(err);
    })




}

function getAllSongs(callback)
{
    let data = '';
    http.get('http://songs-service:5000/songs', {timeout: 3000} ,res => 
    {        
        res.on('data', res => 
        {
            data += res;
            
        })
        res.on('end', () => 
        {
            try 
            {
                const parsedData = JSON.parse(data);
                callback(parsedData);
            } catch (e) 
            {
                console.error(e.message);
            }
        });
    })
    .on('error', e => {
    console.error(e);
    })
    .on('timeout', time => 
    {
        callback(["Error"]);
    });

}

function updateSongs()
{
    getAllSongs((songs) => 
    {
        for(let i = 0; i < songs.length; i++)
        {
            Band.findOne({name: songs[i].artist}, (err, res) => 
            {
                if(res)
                {
                    if(!res.songIds.includes(songs[i].id))
                    {
                        res.songIds.push(songs[i].id);
                        res.save();
                    } 
                }
                
            });
        }
    });
}





async function getSong(id)
{
    try
    {
        let res = await axios.get('http://songs-service:5000/songs/' + JSON.stringify(id), {timeout : 2000});
        return res.data[0];
    }catch(err)
    {
        return("Info about the song is currently unavailable")
    }
}

async function gatherSongs(ids)
{
    let results = [];
    for(let i = 0; i < ids.length; i++)
    {
        results[i] =  await getSong(ids[i]);
    }

    return results;
}

exports.bandsRoute = router;



