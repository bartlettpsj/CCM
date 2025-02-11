import axios from 'axios';

class ConfigClient {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:8080/config') {
        this.baseUrl = baseUrl;
    }

    /**
     * Retrieves a configuration value for a given key and project/environment.
     * @param key - The configuration key (e.g., 'app.endpoint.url').
     * @param defaultValue - The default value to return if the key is not found.
     * @param project - The project name (default: 'myapp').
     * @param environment - The environment name (default: 'dev').
     * @returns The configuration value or the default value if the key is not found.
     */
    async get(key: string, defaultValue: string, project: string = 'myapp', environment: string = 'dev'): Promise<string> {
        try {
            const url = `${this.baseUrl}/${project}/${environment}/${key}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                console.warn(`Key "${key}" not found. Returning default value: ${defaultValue}`);
                return defaultValue;
            } else {
                console.error(`Error fetching configuration: ${error}`);
                throw error;
            }
        }
    }

    /**
     * Sets a configuration value for a given key and project/environment.
     * @param key - The configuration key (e.g., 'app.endpoint.url').
     * @param value - The value to set.
     * @param project - The project name (default: 'myapp').
     * @param environment - The environment name (default: 'dev').
     */
    async set(key: string, value: string, project: string = 'myapp', environment: string = 'dev'): Promise<void> {
        try {
            const url = `${this.baseUrl}/${project}/${environment}/${key}`;
            await axios.put(url, value, {
                headers: { 'Content-Type': 'text/plain' },
            });
            console.log(`Configuration updated: ${key} = ${value}`);
        } catch (error) {
            console.error(`Error updating configuration: ${error}`);
            throw error;
        }
    }
}

// Export a singleton instance of the client
export const config = new ConfigClient();