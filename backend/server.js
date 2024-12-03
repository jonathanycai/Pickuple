import express from 'express';
import appController from './appController.js';
import cors from 'cors';

// Load environment variables from .env file
// Ensure your .env file has the required database credentials.
import loadEnvFile from './utils/envUtil.js';
const envVariables = loadEnvFile('./.env');

const app = express();
const PORT = envVariables.PORT || 65534;  // Adjust the PORT if needed (e.g., if you encounter a "port already occupied" error)

app.use(express.static('public'));

// Middleware setup
app.use(express.json());             // Parse incoming JSON payloads
app.use(cors());
app.use(express.static('public'));

// mount the router
app.use('/', appController);


// ----------------------------------------------------------
// Starting the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

