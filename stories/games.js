
const gallery = document.getElementById("games-gallery");

const GAMES_PAGE_ID = "3e8d3285-6d3a-80b3-a6a3-e8c7da7afd37";

async function loadGames() {
    try {
        const response = await fetch(`/api/category/${GAMES_PAGE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to fetch games");
        }

        const games = await response.json();

        gallery.innerHTML = "";

        const entries = games.filter(item =>
            item.title.trim() !== "" &&
            item.title.toLowerCase() !== "name"
        );

        if (entries.length === 0) {
            gallery.innerHTML = "<p>No games added yet.</p>";
            return;
        }

        entries.forEach(item => {
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
                    poster.innerHTML = `<span>${item.title}</span>`;
                };

                poster.appendChild(img);
            } else {
                poster.innerHTML = `<span>${item.title}</span>`;
            }

            const title = document.createElement("h2");
            title.textContent = item.title;

            const rating = document.createElement("p");
            rating.textContent = `★ ${item.rating}/10`;

            const review = document.createElement("p");
            review.className = "movie-review";
            review.textContent = item.review;

            card.append(poster, title, rating, review);
            gallery.appendChild(card);
        });

    } catch (error) {
        gallery.innerHTML = "<p>Could not load games.</p>";
        console.error(error);
    }
}

loadGames();

