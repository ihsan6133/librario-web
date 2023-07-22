const album_search_input = document.getElementById("search-input");
const create_album_btn = document.querySelector(".create-album");
const create_album_dialog = document.querySelector(".create-album-dialog");
const create_album_form = document.querySelector(".create-album-form");
const album_name_input = document.querySelector(".form-album-name");
const cancel_btn = document.querySelector(".cancel-btn");
const loading_line = document.querySelector(".loader-line");

const albums_view = document.querySelector(".albums-view");


async function post_create_album(name) {
    console.log(name);
    loading_line.classList.add("loading-animation");
    const response = await fetch("api/albums/create", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name: name
        })
    });
    return response
}

create_album_btn.addEventListener("click",(event)=>{
    create_album_dialog.showModal();
});

create_album_form.addEventListener("submit", (event) => {
    event.preventDefault();
    post_create_album(album_name_input.value)
        .then((json)=> {
            loading_line.classList.remove("loading-animation");
            create_album_dialog.close();
            render_albums();
        }).catch((err)=>{
            loading_line.classList.remove("loading-animation");
            
            loading_line.classList.add("error-animation");
            setTimeout(()=>{loading_line.classList.remove("error-animation")}, 500);
        })
});

cancel_btn.addEventListener("click",(event)=>{
    create_album_dialog.close();
});

function generate_album(album, id) {
    
    let container = document.createElement("a");
    container.classList.add("album");
    container.href = `/albums/${id}`;

    let thumbnail = document.createElement("div");
    thumbnail.classList.add("album-thumbnail");
    thumbnail.style.backgroundImage =  `url('/api/albums/thumbnail?album=${id}')`;
    let album_details = document.createElement("div");
    album_details.classList.add("album-details");

    let title = document.createElement("div");
    title.classList.add("album-title");
    title.textContent = album.name;

    let settings = document.createElement("img");
    settings.classList.add("album-settings");
    settings.src = "/public/icons/three-dots-vertical.svg";
    settings.onclick = (e)=>{
        e.preventDefault();
    }


    album_details.append(title, settings)
    container.append(thumbnail, album_details);
    return container;
}

async function fetch_albums(query) {
    let param = "";
    if (query != null)
    {
        param = `?query=${encodeURIComponent(query)}`
    }
    let body = await fetch(`/api/albums${param}`);
    let json = await body.json();
    return json;
}

async function render_albums(query) {
    let albums = await fetch_albums(query);
    albums_view.replaceChildren();
    for (let id in albums) {
        albums_view.appendChild(generate_album(albums[id], id));
    }
}

let timeout = null
album_search_input.addEventListener("input", (event)=>{
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        render_albums(album_search_input.value)
    }, 100);
});


render_albums(null);