import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';

const PORT = process.env.PORT ?? 4000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🥦 PantryPal backend running at http://localhost:${PORT}`);
  console.log(`📄 Swagger docs at http://localhost:${PORT}/api-docs`);
});
