async function main()
{
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const toml = await import('smol-toml')
const isImage = require('is-image')
const sharp = require('sharp')
const {mkdirp} = require('mkdirp')

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
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'albums.html'));
})

app.get('/albums', (req, res)=>{
    res.sendFile(path.join(__dirname,'albums.html'));
});

app.get("/albums/:id", (req, res)=>{
    const id = req.params.id;
    if (!(id in albums))
    {
        res.status(404).send();
        return
    }
    res.render("album", {album_id: id, album_name: albums[id].name}); 
});


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

app.get('/api/albums/:id/', (req, res)=>{
    const id = req.params.id;
    if (!(id in albums)) { res.status(404).send(); return; }

    const album = albums[id];
    if (!("path" in album)) { res.json({files:[]}); return; }

    const path = album.path;
    fs.readdir(path, (err, files)=>{
        if (err) { res.status(404).end(); return; }
        let images = [];
        files.forEach((file)=>{
            if (isImage(file))
            {
                images.push({name: file, type: "image"});
            }
        });
        res.json({files: images});
    });
});

app.get('/api/albums/:id/:filename', (req, res)=>{
    
    const id = req.params.id;
    const filename = req.params.filename;
    if (!(id in albums)) { res.status(404).end(); return; }

    const album = albums[id];
    if (!("path" in album)) { res.status(404).end(); return; }

    const file_path = path.join(album.path, filename);
    if (!fs.existsSync(file_path)) {res.status(404).end(); return; }

    const thumbnail_path = path.join(data_path, "album_thumbnails", id, `${filename}.webp`);
    if (fs.existsSync(thumbnail_path))
    {
        res.type("image/webp").sendFile(thumbnail_path);
        return;
    }

    sharp(file_path)
    .metadata()
    .then((metadata)=>{
        const {width, height} = (metadata.orientation || 0) >= 5
        ? { width: metadata.height, height: metadata.width }
        : { width: metadata.width,  height: metadata.height };
        sharp(file_path)
        .resize((()=>{
            if (height > width)
                return {height: 280}
            else return {width: 280}
        })())
        .webp()
        .rotate()
        .toBuffer().then(data=>{
            res.type("image/webp").send(data);
            mkdirp(path.dirname(thumbnail_path)).then(made=>{
                fs.writeFile(thumbnail_path, data, ()=>{});
            });
        }).catch((err)=>{
            res.status(404).end()
        });
    });

})

app.listen(port, "0.0.0.0", () => {
    console.log(`Example app listening on port ${port}`); 
});

    
}

main();