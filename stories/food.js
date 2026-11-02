
const gallery = document.getElementById("food-gallery");

const FOOD_PAGE_ID = "3e8d3285-6d3a-8052-b6cd-c73cf67a3eb1";

let foodEntries = [];

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

function renderFood() {
    let sorted = [...foodEntries];

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

sortSelect.addEventListener("change", renderFood);

async function loadFood() {
    try {
        const response = await fetch(`/api/category/${FOOD_PAGE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to fetch food entries");
        }

        const food = await response.json();

        foodEntries = food.filter(item =>
            item.title.trim() !== "" &&
            item.title.toLowerCase() !== "name"
        );

        if (foodEntries.length === 0) {
            gallery.textContent = "No food added yet.";
            return;
        }

        renderFood();

    } catch (error) {
        gallery.textContent = "Could not load food.";
        console.error(error);
    }
}

loadFood();
