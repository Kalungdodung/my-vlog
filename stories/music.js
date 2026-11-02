
const gallery = document.getElementById("music-gallery");

const MUSIC_PAGE_ID = "3e8d3285-6d3a-80ec-90e6-f6bccf7d46fc";

let musicEntries = [];

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

function renderMusic() {
    let sorted = [...musicEntries];

    if (sortSelect.value === "high") {
        sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortSelect.value === "low") {
        sorted.sort((a, b) => Number(a.rating) - Number(b.rating));
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

sortSelect.addEventListener("change", renderMusic);

async function loadMusic() {
    try {
        const response = await fetch(`/api/category/${MUSIC_PAGE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to fetch music");
        }

        const music = await response.json();

        musicEntries = music.filter(item =>
            item.title.trim() !== "" &&
            item.title.toLowerCase() !== "name"
        );

        if (musicEntries.length === 0) {
            gallery.textContent = "No music added yet.";
            return;
        }

        renderMusic();

    } catch (error) {
        gallery.textContent = "Could not load music.";
        console.error(error);
    }
}

loadMusic();

