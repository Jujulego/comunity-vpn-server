import mongoose from 'mongoose';
import { app } from '.';

// Constants
const PORT = 3000;
const MONGO_URL = "mongodb://localhost:27017/vpn";

// Function
async function server_setup() {
  // Connect to MongoDB
  mongoose.Promise = global.Promise;
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log("Connected to MongoDB");

  // Start server
  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}/`);
  });
}

server_setup();