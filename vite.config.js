import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    server: {
        host: "0.0.0.0",
        https: {
            key: fs.readFileSync(path.resolve(__dirname, 'localhost+1-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'localhost+1.pem')),
        },
        cors: true,
        watch: {
            usePolling: true,
        },
        strictPort: true,
        port: 3000,
    },
});