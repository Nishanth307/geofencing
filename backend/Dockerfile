# Production runtime image with precompiled binary
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy pre-compiled static Linux amd64 binary
COPY bin/server /app/server

EXPOSE 8080

ENTRYPOINT ["/app/server"]
