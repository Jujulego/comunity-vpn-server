import mongoose from 'mongoose';

import { app } from 'app';
import { env } from 'env';

// Function
async function server_setup() {
  // Connect to MongoDB
  mongoose.Promise = global.Promise;
  await mongoose.connect(env.MONGODB_URL, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log("Connected to MongoDB");

  // Start server
  app.listen(env.PORT, () => {
    console.log(`Server listening at http://localhost:${env.PORT}/`);
  });
}

server_setup();