# Central Configuration Server System Design

## Overview
This system stores configurations in **Apache Zookeeper** and allows for different configurations per **project** and **environment** (e.g., Dev, QA, Stg, Prod). It is accessible via a **RESTful API** and supports individual configuration keys like `app.endpoint.timeout` and `app.endpoint.url`.

---

## System Design

### 1. **Zookeeper Data Structure**
Configurations are stored hierarchically in Zookeeper, organized by **project** and **environment**.

#### Example ZNode Structure:

- /configs
- /{project}
- /{environment}
- /app.endpoint.timeout
- /app.endpoint.url
- /other.config.key


#### Example Data:

- /configs
- /myapp
- /dev
- /app.endpoint.timeout = "5000"
- /app.endpoint.url = "https://dev.api.example.com"
- /qa
- /app.endpoint.timeout = "3000"
- /app.endpoint.url = "https://qa.api.example.com"

### 2. **RESTful API**
The API allows clients to:
- Retrieve configurations for a specific project and environment.
- Retrieve individual configuration values.
- Update configurations (if authorized).

#### Endpoints:
- **GET `/config/{project}/{environment}`**: Retrieve all configurations for a project and environment.
- **GET `/config/{project}/{environment}/{key}`**: Retrieve a specific configuration value.
- **PUT `/config/{project}/{environment}/{key}`**: Update a specific configuration value.

---

### 3. **Configuration Server**
- A server application (e.g., built in Java, Python, or Node.js) interacts with Zookeeper to read and write configurations.
- The server exposes the RESTful API for clients to access configurations.

---
### 4. **Authentication and Authorization**
- Secure the RESTful API with authentication (e.g., API keys, OAuth).
- Restrict write access to authorized users (e.g., admins).

---

### 5. **Caching**
- Cache configurations in memory to reduce latency and avoid frequent Zookeeper reads.

---