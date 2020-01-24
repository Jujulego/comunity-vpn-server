import mongoose from 'mongoose';

import ServerData from 'data/server';
import ServerSchema from 'schemas/server';

// Create model
const Server = mongoose.model<ServerData>('Server', ServerSchema);

export default Server;