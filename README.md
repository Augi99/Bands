# Bands Web Service

## Instructions
* git clone https://github.com/Augi99/Bands --recursive
* cd bands
* docker-compose up -d

## Test data

### Get

URL: 
http://localhost:80/bands

URL: 
http://localhost:80/bands/1

### POST

URL: 
http://localhost:80/bands

{
    "name" : "Powerwolf",
    "genre" : "Power Metal",
    "nationality" : "German"
}

### PUT

URL : 
http://localhost:80/bands/3

{
    "name" : "Nightwish",
    "genre" : "Symphonic Metal",
    "nationality" : "Finnish/Dutch"
}

### DELETE

URL: 
http://localhost:80/bands/7