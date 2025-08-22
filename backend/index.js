import dotenv from "dotenv";
import connectDB from './db/index.js';
import app, { setupRoutes } from './app.js';

dotenv.config({
    path: './.env'
});

connectDB()
.then(async () => {
    const PORT = process.env.PORT || 8080;
    
    // Set up routes after database connection
    await setupRoutes();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed!!!", err);
});