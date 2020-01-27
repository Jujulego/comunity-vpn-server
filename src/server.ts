import mongoose from 'mongoose';

import { app } from 'app';
import { env } from 'env';
import easyrsa from 'easyrsa';

// Function
async function server_setup() {
  // Load or build CA
  if (!await easyrsa.hasCA()) {
    await easyrsa.buildCA({
      commonName: 'Community VPN',
      organizationalUnitName: 'communityvpn.server',
      organizationName: 'Community VPN',
      localityName: 'Paris',
      stateOrProvinceName: 'Ile-de-France',
      countryName: 'France'
    });
  } else {
    await easyrsa.loadCA();
  }

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