// Environment checkup
if (!process.env.IPDATA_KEY) {
  throw new Error('Environment variable IPDATA_KEY required');
}

// Gather environement vars
export const env = {
  IPDATA_KEY: process.env.IPDATA_KEY,
  JWT_KEY: process.env.JWT_KEY || 'superkey!',
  MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017/vpn",
  PORT: process.env.PORT || 8000
};