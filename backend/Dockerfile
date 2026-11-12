# Stage 1: Build binary
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Compile optimized static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/app/main.go

# Stage 2: Minimal Distroless runtime
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /

COPY --from=builder /app/server /server

EXPOSE 8080

USER nonroot:nonroot

ENTRYPOINT ["/server"]
