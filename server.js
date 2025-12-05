import app from './src/app.js';
import { config } from './src/config/env.js';
import { initializeUploadsDirectory } from './src/services/Logistics/LogisticsShippedOrdersService.js';
import { initializeThreePlGigaFedexUploadsDirectory } from './src/services/Logistics/ThreePlGigaFedexService.js';

const { port } = config;

// Initialize uploads directories at server startup
initializeUploadsDirectory();
initializeThreePlGigaFedexUploadsDirectory();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

