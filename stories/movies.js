
const gallery = document.getElementById("movies-gallery");

const MOVIES_PAGE_ID = "3e8d3285-6d3a-80ab-bb9d-e9ff5bee662d";

async function loadMovies() {
    try {
        const response = await fetch(`/api/category/${MOVIES_PAGE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to fetch movies");
        }

        const movies = await response.json();

        gallery.innerHTML = "";

        const entries = movies.filter(movie =>
            movie.title.trim() !== "" &&
            movie.title.toLowerCase() !== "name"
        );

        if (entries.length === 0) {
            gallery.innerHTML = "<p>No movies added yet.</p>";
            return;
        }

        entries.forEach(movie => {
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
                    poster.innerHTML = `<span>${movie.title}</span>`;
                };

                poster.appendChild(img);
            } else {
                poster.innerHTML = `<span>${movie.title}</span>`;
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

    } catch (error) {
        gallery.innerHTML = "<p>Could not load movies.</p>";
        console.error(error);
    }
}

loadMovies();
