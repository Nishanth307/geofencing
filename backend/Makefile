.PHONY: all build run dev test clean docker-up docker-down

BINARY_NAME=bin/server
MAIN_FILE=cmd/app/main.go

all: build

build:
	@echo "Building binary..."
	@mkdir -p bin
	go build -o $(BINARY_NAME) $(MAIN_FILE)

run:
	@echo "Running server..."
	go run $(MAIN_FILE)

dev:
	@echo "Starting live reload with air..."
	air

test:
	@echo "Running tests..."
	go test -v ./...

clean:
	@echo "Cleaning up..."
	@rm -rf bin tmp

docker-up:
	@echo "Starting Docker services..."
	docker compose up -d

docker-down:
	@echo "Stopping Docker services..."
	docker compose down
