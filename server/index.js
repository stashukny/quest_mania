const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// API routes here...

// The "catchall" handler: for any request that doesn't
// match one above, send back the React app.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Important: Add this to make the server listen on the correct port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});