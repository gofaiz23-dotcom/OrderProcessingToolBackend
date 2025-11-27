import app from './src/app.js';
import { config } from './src/config/env.js';
import { initializeUploadsDirectory } from './src/services/Logistics/LogisticsShippedOrdersService.js';

const { port } = config;

// Initialize uploads directory at server startup
initializeUploadsDirectory();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

