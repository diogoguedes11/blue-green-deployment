# Blue-Green Deployment Lab Environment

A demonstration of Blue-Green Deployment strategy using Docker, Docker Compose, and Nginx as a load balancer. This project shows zero-downtime deployments by maintaining two identical production environments.

## What is Blue-Green Deployment?

Blue-Green deployment is a technique that reduces downtime and risk by running two identical production environments called **Blue** and **Green**. At any given time:

- **Blue Environment**: Currently serving production traffic
- **Green Environment**: Staging the next release

When deploying a new version, you switch traffic from Blue to Green (or vice versa) instantly, achieving zero-downtime deployments.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Client        │────│   Nginx Proxy   │
│   (Port 8080)   │    │   (Port 80)     │
└─────────────────┘    └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼───────┐       ┌───────▼───────┐
            │   Blue App    │       │   Green App   │
            │   (v1)        │       │   (v2)        │
            │   Port 3000   │       │   Port 3000   │
            └───────────────┘       └───────────────┘
```

## Project Structure

```text
blue-green-deployment/
├── app.js                 # Simple Express.js application
├── Dockerfile             # Container image definition
├── package.json           # Node.js dependencies
├── compose.yaml           # Docker Compose configuration
├── nginx/
│   └── conf.d/
│       └── default.conf   # Nginx proxy configuration
└── README.md              # This file
```

## Quick Start

### 1. Build Application Images

Build both blue and green versions of the application:

```bash
# Build Blue version (v1)
docker build -t blue-green-app:blue --build-arg APP_VERSION=v1 .

# Build Green version (v2)
docker build -t blue-green-app:green --build-arg APP_VERSION=v2 .
```

### 2. Deploy with Docker Compose

Launch all services (blue, green, and nginx proxy):

```bash
docker compose up -d
```

This will start:

- **Blue service**: Available at `http://localhost:3001`
- **Green service**: Available at `http://localhost:3002`
- **Nginx proxy**: Available at `http://localhost:8080` (routes to green by default)

### 3. Test the Deployment

```bash
# Test direct access to Blue (v1)
curl http://localhost:3001
# Output: Hello from Blue-Green app! Version: v1

# Test direct access to Green (v2)
curl http://localhost:3002
# Output: Hello from Blue-Green app! Version: v2

# Test through Nginx proxy (load balanced with failover)
curl http://localhost:8080
# Output: Hello from Blue-Green app! Version: v1 (primary: blue)
```

## Load Balancing and Failover

The nginx configuration includes automatic failover capabilities:

- **Primary**: Blue service handles all traffic by default
- **Backup**: Green service automatically takes over if blue fails
- **Health Checks**: Nginx monitors service health (max_fails=3, fail_timeout=30s)
- **Automatic Recovery**: When blue comes back online, traffic switches back

### Test Failover

```bash
# Stop the primary service
docker compose stop blue

# Test - should automatically route to green
curl http://localhost:8080
# Output: Hello from Blue-Green app! Version: v2

# Restart blue service
docker compose start blue

# After health check timeout, traffic returns to blue
curl http://localhost:8080
# Output: Hello from Blue-Green app! Version: v1
```

## Manual Blue-Green Switch

For manual deployment switches, you can modify the nginx configuration:

1. **Edit** `nginx/conf.d/default.conf`
2. **Change** which service is primary vs backup:

   ```nginx
   upstream app-cluster {
       server blue:3000 max_fails=3 fail_timeout=30s backup;   # Make blue backup
       server green:3000 max_fails=3 fail_timeout=30s;         # Make green primary
   }
   ```

3. **Restart** nginx to apply changes:

   ```bash
   docker compose restart nginx
   ```

## Docker Networking

Docker Compose automatically creates a network where services can communicate using their service names:

- `blue:3000` - Blue service internal address
- `green:3000` - Green service internal address
- `127.0.0.1:3001` - Won't work from nginx container

The nginx container uses Docker's built-in DNS to resolve `blue` and `green` hostnames to their respective container IP addresses.

## Advanced Usage

### View Container Status

```bash
docker ps
```

### View Logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs nginx
docker compose logs blue
docker compose logs green
```

### Scale Services

```bash
# Scale blue service to 3 instances
docker compose up -d --scale blue=3
```

### Inspect Network

```bash
# See the auto-created network
docker network ls

# Inspect network details
docker network inspect blue-green-deployment_default
```

### Load Balancing Strategies

The project includes examples of different load balancing approaches in `nginx/conf.d/load-balancing-examples.conf.disabled`:

```bash
# View different load balancing options
cat nginx/conf.d/load-balancing-examples.conf.disabled
```

Available strategies:

- **Primary/Backup**: Current configuration (blue primary, green backup)
- **Round Robin**: Equal distribution between services
- **Weighted**: Percentage-based traffic distribution  
- **IP Hash**: Consistent routing based on client IP
- **Least Connections**: Route to server with fewest active connections

## Use Cases

This blue-green deployment setup can be used for:

- Zero-downtime deployments
- Automatic failover and high availability
- A/B testing different application versions
- Feature toggles and gradual rollouts
- Quick rollbacks when issues are detected
- Load testing new versions safely

## Benefits

- Zero Downtime: Instant traffic switching and automatic failover
- High Availability: Service continues even if one instance fails
- Easy Rollback: Switch back immediately if issues arise
- Reduced Risk: Test in production-like environment
- Parallel Testing: Run both versions simultaneously

## Learning Resources

- [Martin Fowler's Blue-Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)


https://roadmap.sh/projects/blue-green-deployment
