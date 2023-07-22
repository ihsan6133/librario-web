console.log(__album_id);

const main = document.querySelector("main");

const observer = new IntersectionObserver((entries, observer)=>{
    console.log(entries);
    entries.forEach((entry)=>{
        if (entry.isIntersecting)
        {    
            entry.target.style.backgroundImage = `url('/api/albums/${__album_id}/${entry.target.filename}')`;
            observer.unobserve(entry.target);
        }
    })
}, {rootMargin: "500px 0%"});


async function fetch_files() {
    let res = await fetch(`/api/albums/${__album_id}`)
    let json = await res.json()
    return json;
}

function generate_thumbnail(file)
{
    const container = document.createElement("div");
    container.classList.add("image");
    container.filename = encodeURIComponent(file.name);

    observer.observe(container);
    return container;
}

function fill_files(files) {
    files.forEach(file=>{
        main.append(generate_thumbnail(file));
    });
}

fetch_files().then((json)=>{
    fill_files(json.files)
})
