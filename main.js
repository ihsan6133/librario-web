async function main()
{
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const toml = await import('smol-toml')


const app = express();
const port = 3000;

const data_path = path.join(__dirname, "user_data");
const albums_toml_path = path.join(data_path, "albums.toml");

function load_albums() {
    let albums;
    try {
        albums = toml.parse(fs.readFileSync(path.join(data_path, "albums.toml")).toString());
    } catch (err){
        console.log(err);
    }

    return albums;

}

function save_albums(albums) {
    fs.writeFile(albums_toml_path, toml.stringify(albums), (err)=>{
        console.log("Error?:", err);
    });
}

let albums = load_albums();
console.log(albums);
save_albums(albums);

app.use("/public", express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'albums.html'));
})


app.get('/api/albums', (req, res) => {
    res.json(albums);  
})

app.post('/api/albums/create', (req, res)=>{
    console.log("Posted", req.body);
    albums[crypto.randomUUID()] = {
        name: req.body.name
    };
    res.status(200).send()
    
    fs.writeFile(path.join(data_path, "albums.toml"), toml.stringify(data), (err)=>{
        console.log("Error?:", err);
    });
    
})

app.get('/api/albums/thumbnail', (req, res)=>{
    
    let id = req.query["album"];
    if (!(id in albums))
    {
        res.status(404).send();
        return;
    }

    if ("thumbnail" in albums[id] )
    {
        console.log("Thumbnail Found in id", id, albums[id]);
    }
    else if (fs.existsSync(path.join(data_path, "album_thumbnails", `${id}.webp`)))
    {
        res.sendFile(path.join(data_path, "album_thumbnails", `${id}.webp`));
    }
    else 
    {
        res.status(404).send();
    }
})

app.listen(port, "0.0.0.0", () => {
    console.log(`Example app listening on port ${port}`); 
})

    
}

main();