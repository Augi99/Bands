const express = require('express');
const router = express.Router();

const BandModule = require('./Band');
const Band = BandModule.Band;

const va = require('./Validator');

//const request = require('request');
const http = require('http');
const { abort } = require('process');
http.set

const Validator = va.validator;
const validator = new Validator();

router.get('/', (req, res) =>
{
    
    Band.find()
    .then(result => 
    {
        getAllSongs((songs) => 
        {
            //console.log("songs: " + songs);
            if(result.length > 0)
            {
                res.send(prepareResponseArray(result, songs));
            }else
            {
                res.status(404);
                res.send("No bands found");
            }
        });
    })
    .catch(error =>
    {
        //console.log(error);
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
        }

        getAllSongs((songs) =>
        {
            res.send(prepareResponse(result, songs));
        });
        
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
            getAllSongs((songs) => 
            {
                res.status(200);
                res.location("http:/localhost:5000/bands/" + result.id);
                //console.log(songs);
                res.send(prepareResponse(updatedBand, songs));
            });
            
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
            getAllSongs((songs) => 
            {
                res.status(200);
                res.send(prepareResponse(result, songs));
            });
            
            
        }else
        {
            res.status(404);
            res.send("The band did not exist");
        }
    });

});

function prepareResponse(result, songs)
{
    let response = result.toJSON();
    delete response._id;
    delete response.__v;
    let theirSongs = songs.filter(song => song.artist === response.name);
    if(songs[0] != 'Error')
    {
        if(theirSongs.length != 0)
        {
            for(let j = 0; j < theirSongs.length; j++)
            {
                //console.log(theirSongs[0]);
                delete theirSongs[j].id;
                delete theirSongs[j].artist;
                delete theirSongs[j].date_created;
            }
            response.songs = theirSongs;
        }else response.songs = "We don't know any of their songs";
    }else response.songs = "Their song collection is currently unavailable";
    
    //console.log(response);
    return response;
}


function prepareBand(result)
{
    let response = result.toJSON();
    delete response._id;
    delete response.__v;
    
    return response;
}

function prepareResponseArray(result, songs)
{
    let responseArray = [];
    for(let  i = 0; i < result.length; i++)
    {
        let response = result[i].toJSON();
        //console.log(response);
        delete response._id;
        delete response.__v;
        if(songs[0] != 'Error')
        {
            let theirSongs = songs.filter(song => song.artist === response.name); 
            //console.log(theirSongs.length +  " " +  response.name);
            if(theirSongs.length != 0)
            {
                for(let j = 0; j < theirSongs.length; j++)
                {
                    //console.log(theirSongs[0]);
                    delete theirSongs[j].id;
                    delete theirSongs[j].artist;
                    delete theirSongs[j].date_created;
                }
                response.songs = theirSongs;
            }else response.songs = "We don't know any of their songs";
            
            
        }else response.songs = "Their song collection is currently unavailable";
        
        responseArray.push(response);
    }
    return responseArray;
}

function createBand(identificator, req, res)
{
    let newBand = new Band(
    {
        id : identificator,
        name : req.body.name,
        genre : req.body.genre,
        nationality: req.body.nationality
    });



    const {error} = validator.validateBand(newBand.toJSON());
    if(error)
    {
        res.status(400);
        res.send("Post request must specify name, genre and nationality of the band");
        return;
    }

    newBand.save()
    .then((result) => 
    {
        getAllSongs((songs) =>
        {
            res.status(201);
            res.location("http:/localhost:80/bands/" + newBand.id);
            res.send(prepareResponse(result, songs));
        });
    })
    .catch((err) => {
        res.send("Post failed");
    });
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
        try {
          const parsedData = JSON.parse(data);
          //console.log(parsedData);
          callback(parsedData);
        } catch (e) {
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
        //abort();
    });

}


exports.bandsRoute = router;



