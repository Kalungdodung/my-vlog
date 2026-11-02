
const gallery = document.getElementById("games-gallery");

const GAMES_PAGE_ID = "3e8d3285-6d3a-80b3-a6a3-e8c7da7afd37";

let gameEntries = [];

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

function renderGames() {
    let sorted = [...gameEntries];

    if (sortSelect.value === "high") {
        sorted.sort((a, b) => {
            const x = Number(a.rating);
            const y = Number(b.rating);
            return (Number.isNaN(y) ? -Infinity : y) -
                   (Number.isNaN(x) ? -Infinity : x);
        });
    } else if (sortSelect.value === "low") {
        sorted.sort((a, b) => {
            const x = Number(a.rating);
            const y = Number(b.rating);
            return (Number.isNaN(x) ? Infinity : x) -
                   (Number.isNaN(y) ? Infinity : y);
        });
    } else if (sortSelect.value === "az") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    gallery.innerHTML = "";

    sorted.forEach(item => {
        const card = document.createElement("article");
        card.className = "movie-card";

        const poster = document.createElement("div");
        poster.className = "movie-poster";

        if (item.image) {
            const img = document.createElement("img");
            img.src = item.image;
            img.alt = item.title;
            img.loading = "lazy";

            img.onerror = () => {
                img.remove();
                const fallback = document.createElement("span");
                fallback.textContent = item.title;
                poster.appendChild(fallback);
            };

            poster.appendChild(img);
        } else {
            const fallback = document.createElement("span");
            fallback.textContent = item.title;
            poster.appendChild(fallback);
        }

        const title = document.createElement("h2");
        title.textContent = item.title;

        const rating = document.createElement("p");
        rating.className = "movie-rating";
        rating.textContent = `★ ${item.rating}/10`;

        const review = document.createElement("p");
        review.className = "movie-review";
        review.textContent = item.review;

        card.append(poster, title, rating, review);
        gallery.appendChild(card);
    });
}

sortSelect.addEventListener("change", renderGames);

async function loadGames() {
    try {
        const response = await fetch(`/api/category/${GAMES_PAGE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to fetch games");
        }

        const games = await response.json();

        gameEntries = games.filter(item =>
            item.title.trim() !== "" &&
            item.title.toLowerCase() !== "name"
        );

        if (gameEntries.length === 0) {
            gallery.textContent = "No games added yet.";
            return;
        }

        renderGames();

    } catch (error) {
        gallery.textContent = "Could not load games.";
        console.error(error);
    }
}

loadGames();
