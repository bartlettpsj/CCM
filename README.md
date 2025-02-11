#### **1. Central Configuration Server System Design**
**User**:  
Produce a central configuration server system that stores all configs inside Zookeeper and allows a different configuration per project and then environment, such as Dev, QA, Stg, and Prod. Must be accessible via RESTful API. Configurations are stored and accessed down to individual values such as `app.endpoint.timeout` and `app.endpoint.url`.

**Assistant**:  
To create a central configuration server system that stores configurations in Apache Zookeeper and allows for different configurations per project and environment (e.g., Dev, QA, Stg, Prod), while being accessible via a RESTful API, we can design the system as follows:

---

### **System Design**

1. **Zookeeper Data Structure**:
   - Configurations are stored in a hierarchical structure in Zookeeper.
   - The structure is organized by `project` and `environment`.
   - Example ZNode structure:
     ```
     /configs
       /{project}
         /{environment}
           /app.endpoint.timeout
           /app.endpoint.url
           /other.config.key
     ```
   - Example:
     ```
     /configs
       /myapp
         /dev
           /app.endpoint.timeout = "5000"
           /app.endpoint.url = "https://dev.api.example.com"
         /qa
           /app.endpoint.timeout = "3000"
           /app.endpoint.url = "https://qa.api.example.com"
     ```

2. **RESTful API**:
   - The API allows clients to:
      - Retrieve configurations for a specific project and environment.
      - Retrieve individual configuration values.
      - Update configurations (if authorized).
   - Example endpoints:
      - `GET /config/{project}/{environment}`: Retrieve all configurations for a project and environment.
      - `GET /config/{project}/{environment}/{key}`: Retrieve a specific configuration value.
      - `PUT /config/{project}/{environment}/{key}`: Update a specific configuration value.

3. **Configuration Server**:
   - A server application (e.g., built in Java, Python, or Node.js) interacts with Zookeeper to read and write configurations.
   - The server exposes the RESTful API for clients to access configurations.

4. **Authentication and Authorization**:
   - Secure the RESTful API with authentication (e.g., API keys, OAuth).
   - Restrict write access to authorized users (e.g., admins).

5. **Caching**:
   - Cache configurations in memory to reduce latency and avoid frequent Zookeeper reads.

---

#### **2. Java Implementation**
**User**:  
Create this using Java 21.

**Assistant**:  
To create a central configuration server system using **Java 21**, we can use the following stack:
- **Spring Boot** for building the RESTful API.
- **Apache Curator** for interacting with Zookeeper.
- **Maven** for dependency management.

Below is a step-by-step implementation:

---

### **Step 1: Set Up Zookeeper**
1. Install and start Zookeeper:
   - Download Zookeeper from [https://zookeeper.apache.org/](https://zookeeper.apache.org/).
   - Start Zookeeper using the provided `zkServer.sh` script.

2. Create the base ZNode structure:
   - Use the Zookeeper CLI (`zkCli.sh`) to create the `/configs` ZNode:
     ```bash
     zkCli.sh create /configs ""
     ```

---

### **Step 2: Create a Spring Boot Project**
1. Use [Spring Initializr](https://start.spring.io/) to generate a Spring Boot project with the following dependencies:
   - **Spring Web** (for RESTful API).
   - **Apache Curator** (for Zookeeper interaction).

2. Add the following dependencies to your `pom.xml`:
   ```xml
   <dependencies>
       <!-- Spring Boot Starter Web -->
       <dependency>
           <groupId>org.springframework.boot</groupId>
           <artifactId>spring-boot-starter-web</artifactId>
       </dependency>

       <!-- Apache Curator for Zookeeper -->
       <dependency>
           <groupId>org.apache.curator</groupId>
           <artifactId>curator-framework</artifactId>
           <version>5.5.0</version>
       </dependency>
       <dependency>
           <groupId>org.apache.curator</groupId>
           <artifactId>curator-recipes</artifactId>
           <version>5.5.0</version>
       </dependency>

       <!-- Lombok for reducing boilerplate code -->
       <dependency>
           <groupId>org.projectlombok</groupId>
           <artifactId>lombok</artifactId>
           <scope>provided</scope>
       </dependency>
   </dependencies>
   ```

---

### **Step 3: Implement the Configuration Server**

#### **1. Zookeeper Configuration**
Create a configuration class to set up the Zookeeper client:
```java
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ZookeeperConfig {

    @Bean
    public CuratorFramework curatorFramework() {
        CuratorFramework client = CuratorFrameworkFactory.newClient(
                "localhost:2181", // Zookeeper connection string
                new ExponentialBackoffRetry(1000, 3) // Retry policy
        );
        client.start();
        return client;
    }
}
```

#### **2. REST Controller**
Create a REST controller to expose the configuration endpoints:
```java
import org.apache.curator.framework.CuratorFramework;
import org.apache.zookeeper.data.Stat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/config")
public class ConfigController {

    @Autowired
    private CuratorFramework curatorFramework;

    @GetMapping("/{project}/{environment}")
    public Map<String, String> getConfig(@PathVariable String project, @PathVariable String environment) throws Exception {
        String path = "/configs/" + project + "/" + environment;
        Map<String, String> config = new HashMap<>();

        if (curatorFramework.checkExists().forPath(path) != null) {
            for (String key : curatorFramework.getChildren().forPath(path)) {
                byte[] value = curatorFramework.getData().forPath(path + "/" + key);
                config.put(key, new String(value, StandardCharsets.UTF_8));
            }
        }
        return config;
    }

    @GetMapping("/{project}/{environment}/{key}")
    public String getConfigValue(@PathVariable String project, @PathVariable String environment, @PathVariable String key) throws Exception {
        String path = "/configs/" + project + "/" + environment + "/" + key;
        Stat stat = curatorFramework.checkExists().forPath(path);
        if (stat != null) {
            byte[] value = curatorFramework.getData().forPath(path);
            return new String(value, StandardCharsets.UTF_8);
        } else {
            throw new RuntimeException("Key not found");
        }
    }

    @PutMapping("/{project}/{environment}/{key}")
    public String updateConfigValue(@PathVariable String project, @PathVariable String environment, @PathVariable String key, @RequestBody String value) throws Exception {
        String path = "/configs/" + project + "/" + environment + "/" + key;
        curatorFramework.create().orSetData().creatingParentsIfNeeded().forPath(path, value.getBytes(StandardCharsets.UTF_8));
        return "Configuration updated successfully";
    }
}
```

#### **3. Main Application Class**
Create the main application class:
```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

---

#### **3. TypeScript Client**
**User**:  
Produce a CLIENT in TypeScript that accesses this server with calls such as `value = config.get('myapp.endpoint.url', default)` and also `config.set('myapp.endpoint.url', 'http://localhost:2021/paulservice')`.

**Assistant**:  
Below is a **TypeScript client** that interacts with the Java-based configuration server you created. This client provides methods like `config.get` and `config.set` to retrieve and update configuration values, respectively.

---

### **TypeScript Client Implementation**

#### **1. Install Dependencies**
Install the required dependencies for making HTTP requests:
```bash
npm install axios
```

#### **2. Create the Configuration Client**
Create a file named `config-client.ts`:

```typescript
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
```

---

### **Usage Example**

#### **1. Import and Use the Client**
Create a file named `index.ts` to demonstrate how to use the client:

```typescript
import { config } from './config-client';

async function main() {
    try {
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
```

#### **2. Run the Client**
Compile and run the TypeScript code:
```bash
npx ts-node index.ts
```

---

### **Example Output**
If the configuration server is running and Zookeeper has the following data:
```
/configs/myapp/dev/app.endpoint.timeout = "5000"
```

The output will be:
```
Timeout: 5000
URL: http://default.api.example.com
Configuration updated successfully.
Updated URL: http://localhost:2021/paulservice
```

---

### **Key Features**
1. **Default Values**:
   - If a key is not found, the client returns the provided default value.

2. **Error Handling**:
   - Handles 404 errors (key not found) gracefully.
   - Logs errors for other issues (e.g., server down).

3. **Flexibility**:
   - Allows specifying project and environment (defaults to `myapp` and `dev`).

4. **Singleton Client**:
   - Exports a singleton instance of the client for easy reuse.

---

### **Testing the Client**
1. Start the Java configuration server.
2. Run the TypeScript client using `npx ts-node index.ts`.
3. Verify the output and check Zookeeper for updated values.

---

This TypeScript client provides a clean and reusable way to interact with your configuration server. Let me know if you need further enhancements!

---
