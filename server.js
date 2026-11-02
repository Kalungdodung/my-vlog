
require("dotenv").config();

const express = require("express");
const path = require("path");
const { Client } = require("@notionhq/client");

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const CACHE_TTL = 30 * 1000; // 30 seconds

if (!process.env.NOTION_TOKEN || !process.env.NOTION_PAGE_ID) {
    console.error("Missing NOTION_TOKEN or NOTION_PAGE_ID environment variable.");
    process.exit(1);
}

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

// Category page IDs
const CATEGORIES = [
    {
        name: "Music",
        id: "3e8d3285-6d3a-80ec-90e6-f6bccf7d46fc"
    },
    {
        name: "Movies",
        id: "3e8d3285-6d3a-80ab-bb9d-e9ff5bee662d"
    },
    {
        name: "Games",
        id: "3e8d3285-6d3a-80b3-a6a3-e8c7da7afd37"
    },
    {
        name: "Food",
        id: "3e8d3285-6d3a-8052-b6cd-c73cf67a3eb1"
    }
];

// =====================================
// CACHE
// =====================================

const categoryCache = new Map();

// =====================================
// NOTION PROPERTY HELPERS
// =====================================

function getPlainText(items = []) {
    if (!Array.isArray(items)) return "";

    return items
        .map(item => item.plain_text || item.text?.content || "")
        .join("");
}

function getPropertyText(property) {
    if (!property) return "";

    switch (property.type) {
        case "title":
            return getPlainText(property.title);

        case "rich_text":
            return getPlainText(property.rich_text);

        case "number":
            return property.number === null
                ? ""
                : String(property.number);

        case "select":
            return property.select?.name || "";

        case "status":
            return property.status?.name || "";

        case "checkbox":
            return String(property.checkbox);

        case "formula": {
            const formula = property.formula;

            if (!formula) return "";

            if (formula.type === "string") return formula.string || "";
            if (formula.type === "number") {
                return formula.number === null ? "" : String(formula.number);
            }
            if (formula.type === "boolean") return String(formula.boolean);

            return "";
        }

        default:
            return "";
    }
}

// =====================================
// NOTION PAGINATION
// =====================================

async function getAllBlocks(blockId) {
    let results = [];
    let hasMore = true;
    let startCursor;

    while (hasMore) {
        const response = await notion.blocks.children.list({
            block_id: blockId,
            page_size: 100,
            ...(startCursor ? { start_cursor: startCursor } : {})
        });

        results.push(...response.results);

        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    return results;
}

// =====================================
// FIND CATEGORY DATABASE
// =====================================

async function getCategoryDatabase(pageId) {
    const blocks = await getAllBlocks(pageId);

    const databaseBlock = blocks.find(
        block => block.type === "child_database"
    );

    if (!databaseBlock) {
        throw new Error(`No database found on category page: ${pageId}`);
    }

    const database = await notion.databases.retrieve({
        database_id: databaseBlock.id
    });

    if (!database.data_sources?.length) {
        throw new Error(`No data source found: ${databaseBlock.id}`);
    }

    return database.data_sources[0].id;
}

// =====================================
// FETCH CATEGORY ENTRIES
// =====================================

async function fetchCategoryEntries(pageId) {
    const dataSourceId = await getCategoryDatabase(pageId);

    let results = [];
    let hasMore = true;
    let startCursor;

    while (hasMore) {
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            page_size: 100,
            ...(startCursor ? { start_cursor: startCursor } : {})
        });

        results.push(...response.results);

        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    return results
        .map(page => {
            const properties = page.properties;

            const imageFiles = properties.Image?.files || [];
            const imageFile = imageFiles[0];

            return {
                title: getPropertyText(properties.Name),
                rating: getPropertyText(properties.Rating),
                review: getPropertyText(properties.Review),

                image:
                    imageFile?.file?.url ||
                    imageFile?.external?.url ||
                    ""
            };
        })
        .filter(item => item.title.trim() !== "");
}

// =====================================
// CACHED CATEGORY ENTRIES
// =====================================

async function getCategoryEntries(pageId) {
    const cached = categoryCache.get(pageId);

    // Return valid cached data
    if (cached?.data && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    // Reuse an ongoing request
    if (cached?.promise) {
        return cached.promise;
    }

    // Fetch fresh data
    const promise = fetchCategoryEntries(pageId);

    categoryCache.set(pageId, { promise });

    try {
        const entries = await promise;

        categoryCache.set(pageId, {
            data: entries,
            expiresAt: Date.now() + CACHE_TTL
        });

        return entries;

    } catch (error) {
        categoryCache.delete(pageId);
        throw error;
    }
}

// =====================================
// API ERROR HANDLING
// =====================================

function handleApiError(res, error, context) {
    console.error(`[${context}]`, error);

    res.status(500).json({
        error: "Unable to retrieve data right now. Please try again shortly."
    });
}

// Prevent browser caching of API responses
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// =====================================
// NOTION CONNECTION CHECK
// =====================================

app.get("/api/notion-check", async (req, res) => {
    try {
        await notion.pages.retrieve({
            page_id: process.env.NOTION_PAGE_ID
        });

        res.json({
            connected: true,
            message: "Notion connected successfully!"
        });

    } catch (error) {
        handleApiError(res, error, "Notion connection check");
    }
});

// =====================================
// WEBSITE FILES
// =====================================

app.get(["/", "/index.html"], (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "style.css"));
});

app.use("/stories", express.static(path.join(__dirname, "stories")));
app.use("/images", express.static(path.join(__dirname, "images")));

// =====================================
// CATEGORY LIST
// =====================================

app.get("/api/categories", async (req, res) => {
    try {
        const blocks = await getAllBlocks(process.env.NOTION_PAGE_ID);

        const categories = blocks
            .filter(block => block.type === "child_page")
            .filter(block => CATEGORIES.some(category => category.id === block.id))
            .map(block => ({
                name: block.child_page.title,
                id: block.id
            }));

        res.json(categories);

    } catch (error) {
        handleApiError(res, error, "Categories");
    }
});

// =====================================
// CATEGORY ENTRIES
// =====================================

app.get("/api/category/:id", async (req, res) => {
    try {
        const category = CATEGORIES.find(
            item => item.id === req.params.id
        );

        if (!category) {
            return res.status(404).json({
                error: "Category not found."
            });
        }

        const entries = await getCategoryEntries(category.id);

        res.json(entries);

    } catch (error) {
        handleApiError(res, error, "Category entries");
    }
});

// =====================================
// HOMEPAGE STATISTICS
// =====================================

app.get("/api/stats", async (req, res) => {
    try {
        const allEntries = await Promise.all(
            CATEGORIES.map(category =>
                getCategoryEntries(category.id)
            )
        );

        const total = allEntries.reduce(
            (sum, entries) => sum + entries.length,
            0
        );

        res.json({ total });

    } catch (error) {
        handleApiError(res, error, "Homepage statistics");
    }
});

// =====================================
// HOMEPAGE HIGHLIGHTS
// =====================================

app.get("/api/highlights", async (req, res) => {
    try {
        const categoryEntries = await Promise.all(
            CATEGORIES.map(async category => {
                const entries = await getCategoryEntries(category.id);

                return entries.map(item => ({
                    ...item,
                    category: category.name
                }));
            })
        );

        const highlights = categoryEntries.flat();

        res.json(highlights);

    } catch (error) {
        handleApiError(res, error, "Homepage highlights");
    }
});

// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {
    console.log(`Website running on port ${PORT}`);
});
