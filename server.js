
require("dotenv").config();

const express = require("express");
const { Client } = require("@notionhq/client");

const app = express();
const PORT = process.env.PORT || 3001;

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

// Extract plain text from Notion properties
function getPlainText(items = []) {
    return items.map(item => item.plain_text || "").join("");
}

// Find the database inside a category page
async function getCategoryDatabase(pageId) {
    const response = await notion.blocks.children.list({
        block_id: pageId
    });

    const databaseBlock = response.results.find(
        block => block.type === "child_database"
    );

    if (!databaseBlock) {
        throw new Error(`No database found on page: ${pageId}`);
    }

    const database = await notion.databases.retrieve({
        database_id: databaseBlock.id
    });

    if (!database.data_sources || !database.data_sources.length) {
        throw new Error(`No data source found for database: ${databaseBlock.id}`);
    }

    return database.data_sources[0].id;
}

// Fetch all entries from a category database
async function getCategoryEntries(pageId) {
    const dataSourceId = await getCategoryDatabase(pageId);

    let results = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            start_cursor: startCursor
        });

        results.push(...response.results);

        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    return results.map(page => {
        const properties = page.properties;

        const imageFile = properties.Image?.files?.[0];

        return {
            title: getPlainText(
                properties.Name?.title
            ),

            rating: getPlainText(
                properties.Rating?.rich_text
            ),

            review: getPlainText(
                properties.Review?.rich_text
            ),

            image:
                imageFile?.file?.url ||
                imageFile?.external?.url ||
                ""
        };
    }).filter(item => item.title.trim() !== "");
}

// Check Notion connection
app.get("/api/notion-check", async (req, res) => {
    try {
        const page = await notion.pages.retrieve({
            page_id: process.env.NOTION_PAGE_ID
        });

        res.json({
            connected: true,
            message: "Notion connected successfully!",
            page: page
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            connected: false,
            message: error.message
        });
    }
});

// Homepage
app.get(["/", "/index.html"], (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/style.css", (req, res) => {
    res.sendFile(__dirname + "/style.css");
});

app.use("/stories", express.static(__dirname + "/stories"));
app.use("/images", express.static(__dirname + "/images"));

// Get category names
app.get("/api/categories", async (req, res) => {
    try {
        const response = await notion.blocks.children.list({
            block_id: process.env.NOTION_PAGE_ID
        });

        const categories = response.results
            .filter(block => block.type === "child_page")
            .map(block => ({
                name: block.child_page.title,
                id: block.id
            }));

        res.json(categories);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Get entries for a category
app.get("/api/category/:id", async (req, res) => {
    try {
        const entries = await getCategoryEntries(
            req.params.id
        );

        res.json(entries);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Homepage statistics
app.get("/api/stats", async (req, res) => {
    try {
        let total = 0;

        for (const category of CATEGORIES) {
            const entries = await getCategoryEntries(
                category.id
            );

            total += entries.length;
        }

        res.json({ total });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Homepage highlights
app.get("/api/highlights", async (req, res) => {
    try {
        const highlights = [];

        for (const category of CATEGORIES) {
            const entries = await getCategoryEntries(
                category.id
            );

            const categoryEntries = entries.map(item => ({
                ...item,
                category: category.name
            }));

            highlights.push(...categoryEntries);
        }

        res.json(highlights);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(
        `Website running at http://localhost:${PORT}`
    );
});
