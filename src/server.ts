import http from 'http';
import mongoose from 'mongoose';
import SocketIO from 'socket.io';

import { app } from 'app';
import { env } from 'env';
import easyrsa from 'easyrsa';
import wsapp from 'wsapp';

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
  const server = http.createServer(app);
  wsapp(SocketIO(server).of('/api'));

  server.listen(env.PORT, () => {
    console.log(`Server listening at http://localhost:${env.PORT}/`);
  });
}

server_setup();