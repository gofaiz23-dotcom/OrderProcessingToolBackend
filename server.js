import app from './src/app.js';
import { config } from './src/config/env.js';
import { initializeUploadsDirectory } from './src/services/Logistics/LogisticsShippedOrdersService.js';
import { startStatusUpdateService } from './src/services/Logistics/ShipmentStatusUpdateService.js';

const { port } = config;

// Initialize uploads directory at server startup
initializeUploadsDirectory();

// Start periodic shipment status update service
startStatusUpdateService();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

