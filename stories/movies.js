
const gallery = document.getElementById("movies-gallery");

const MOVIES_PAGE_ID = "3e8d3285-6d3a-80ab-bb9d-e9ff5bee662d";

let movieEntries = [];

const sortWrapper = document.createElement("div");
sortWrapper.className = "sort-wrapper";

const sortLabel = document.createElement("label");
sortLabel.textContent = "Sort by ";

const sortSelect = document.createElement("select");
sortSelect.className = "sort-select";

[
    { value: "default", text: "Default" },
    { value: "high", text: "Highest Rated" },
    { value: "low", text: "Lowest Rated" },
    { value: "az", text: "A–Z" }
].forEach(option => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.text;
    sortSelect.appendChild(item);
});

sortLabel.appendChild(sortSelect);
sortWrapper.appendChild(sortLabel);
gallery.parentElement.insertBefore(sortWrapper, gallery);

function renderMovies() {
    let sorted = [...movieEntries];

    if (sortSelect.value === "high") {
        sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortSelect.value === "low") {
        sorted.sort((a, b) => Number(a.rating) - Number(b.rating));
    } else if (sortSelect.value === "az") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    gallery.innerHTML = "";

    sorted.forEach(movie => {
        const card = document.createElement("article");
        card.className = "movie-card";

        const poster = document.createElement("div");
        poster.className = "movie-poster";

        if (movie.image) {
            const img = document.createElement("img");
            img.src = movie.image;
            img.alt = movie.title;
            img.loading = "lazy";

            img.onerror = () => {
                img.remove();
                const fallback = document.createElement("span");
                fallback.textContent = movie.title;
                poster.appendChild(fallback);
            };

            poster.appendChild(img);
        } else {
            const fallback = document.createElement("span");
            fallback.textContent = movie.title;
            poster.appendChild(fallback);
        }

        const title = document.createElement("h2");
        title.textContent = movie.title;

        const rating = document.createElement("p");
        rating.className = "movie-rating";
        rating.textContent = `★ ${movie.rating}/10`;

        const review = document.createElement("p");
        review.className = "movie-review";
        review.textContent = movie.review;

        card.append(poster, title, rating, review);
        gallery.appendChild(card);
    });
}

sortSelect.addEventListener("change", renderMovies);

async function loadMovies() {
    try {
        const response = await fetch(`/api/category/${MOVIES_PAGE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to fetch movies");
        }

        const movies = await response.json();

        movieEntries = movies.filter(movie =>
            movie.title.trim() !== "" &&
            movie.title.toLowerCase() !== "name"
        );

        if (movieEntries.length === 0) {
            gallery.textContent = "No movies added yet.";
            return;
        }

        renderMovies();

    } catch (error) {
        gallery.textContent = "Could not load movies.";
        console.error(error);
    }
}

loadMovies();
