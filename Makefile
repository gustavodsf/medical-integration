.PHONY: help up down build logs test clean

help: ## Show this help message
	@echo "Medical Event Integration - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services with Docker Compose
	docker-compose up --build -d

down: ## Stop all services
	docker-compose down

build: ## Build all services
	docker-compose build

logs: ## View logs from all services
	docker-compose logs -f

logs-ingest: ## View logs from ingest service only
	docker-compose logs -f ingest-service

logs-processor: ## View logs from processor service only
	docker-compose logs -f processor-service

test: ## Run test script
	./test-events.sh

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

mongo: ## Connect to MongoDB shell
	docker exec -it medical-mongodb mongosh medical_events

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:3000/health | jq '.'
	@curl -s http://localhost:3001/health | jq '.'

status: ## Show status of all containers
	docker-compose ps

