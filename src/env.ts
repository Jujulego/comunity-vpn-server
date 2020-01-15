export const env = {
  JWT_KEY: process.env.JWT_KEY || 'superkey!',
  MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017/vpn",
  PORT: process.env.PORT || 8000
};