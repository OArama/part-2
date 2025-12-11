const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI || 'mongodb+srv://fmboya:cs20@mongo.kyn7lg2.mongodb.net/?appName=mongo';
const dbName = 'Stock';
const collectionName = 'PublicCompanies';

let db;
let collection;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        db = client.db(dbName);
        collection = db.collection(collectionName);
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route: Home View
app.get('/', (req, res) => {
    res.render('home');
});

// Route: Process View
app.get('/process', async (req, res) => {
    try {
        const { search, searchType } = req.query;
        
        console.log('\n--- Search Request ---');
        console.log(`Search Type: ${searchType}`);
        console.log(`Search Term: ${search}`);
        
        if (!search || !searchType) {
            return res.render('process', { 
                error: 'Please provide both a search term and search type.',
                results: null 
            });
        }
        
        let query;
        let results;
        
        // Determine search type and build query
        if (searchType === 'ticker') {
            // Search by ticker symbol (case-insensitive)
            query = { ticker: search.toUpperCase() };
            console.log(`Searching by ticker: ${search.toUpperCase()}`);
        } else if (searchType === 'company') {
            // Search by company name (case-insensitive, partial match)
            query = { company: { $regex: search, $options: 'i' } };
            console.log(`Searching by company name: ${search}`);
        } else {
            return res.render('process', { 
                error: 'Invalid search type.',
                results: null 
            });
        }
        
        // Query the database
        results = await collection.find(query).toArray();
        
        console.log(`\n--- Results (${results.length} found) ---`);
        
        if (results.length === 0) {
            console.log('No matches found.');
        } else {
            results.forEach((result, index) => {
                console.log(`${index + 1}. Company: ${result.company}, Ticker: ${result.ticker}, Price: $${result.price}`);
            });
        }
        
        // Render the process view with results
        res.render('process', { 
            error: null,
            results: results,
            searchTerm: search,
            searchType: searchType
        });
        
    } catch (error) {
        console.error('Error processing search:', error);
        res.render('process', { 
            error: 'An error occurred while processing your search.',
            results: null 
        });
    }
});

// Start server
connectToDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});