import { config } from './config-client';

async function main() {
    try {
        // Set a configuration value
        await config.set('app.endpoint.url', 'http://localhost:2021/paulservice');
        console.log('Configuration updated successfully.');

        await config.set('app.endpoint.timeout', '1000');
        console.log('Configuration updated successfully.');

        // Get a configuration value
        const timeout = await config.get('app.endpoint.timeout', '5000');
        console.log(`Timeout: ${timeout}`);

        const url = await config.get('app.endpoint.url', 'http://default.api.example.com');
        console.log(`URL: ${url}`);

        // Set a configuration value
        await config.set('app.endpoint.url', 'http://localhost:2021/paulservice');
        console.log('Configuration updated successfully.');

        // Verify the update
        const updatedUrl = await config.get('app.endpoint.url', 'http://default.api.example.com');
        console.log(`Updated URL: ${updatedUrl}`);
    } catch (error) {
        console.error('Error in main:', error);
    }
}

main();