# Blue green deployment lab environment



# Deploy both blue and green versions of the app

```bash
docker build -t blue-green-app:blue --build-arg APP_VERSION=v1 .
docker build -t blue-green-app:green --build-arg APP_VERSION=v2 .
```

# Deploy Docker compose

```bash
docker compose up -d
```

