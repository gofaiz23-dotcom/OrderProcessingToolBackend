import app from './app.js';
import { config } from './config/env.js';

const { port } = config;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

