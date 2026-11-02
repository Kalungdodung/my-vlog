
const gallery = document.getElementById("food-gallery");

const FOOD_PAGE_ID = "3e8d3285-6d3a-8052-b6cd-c73cf67a3eb1";

async function loadFood() {
    try {
        const response = await fetch(`/api/category/${FOOD_PAGE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to fetch food entries");
        }

        const food = await response.json();

        gallery.innerHTML = "";

        const entries = food.filter(item =>
            item.title.trim() !== "" &&
            item.title.toLowerCase() !== "name"
        );

        if (entries.length === 0) {
            gallery.innerHTML = "<p>No food added yet.</p>";
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
        gallery.innerHTML = "<p>Could not load food.</p>";
        console.error(error);
    }
}

loadFood();
