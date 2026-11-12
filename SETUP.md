Folder structure
geofence-system/
├── docker-compose.yml        db + api + caddy
├── .env.example
├── caddy/Caddyfile          HTTPS reverse proxy
├── SETUP.md
└── backend/
    ├── Dockerfile            multi-stage, distroless
    ├── cmd/server/main.go    wiring + graceful shutdown
    └── internal/
        ├── config/           env vars
        ├── db/               pgx pool + migration runner
        │   └── migrations/001_init.sql
        ├── httpx/            time_ns middleware + JSON helpers
        ├── handlers/         one file per endpoint group (stubs return 501)
        ├── server/router.go  all 9 endpoints with the exact paths
        ├── ws/hub.go         WebSocket hub
        ├── alerts/           async dispatcher
        └── id/               "geo_ab12cd34ef56" style IDs