.PHONY: build up down logs psql backend-shell frontend-shell setup

COMPOSE_FILE = deployments/local-dev/compose.yml
ENV_FILE = deployments/local-dev/.env

setup:
	@if [ ! -f $(ENV_FILE) ]; then \
		cp deployments/local-dev/.env.example $(ENV_FILE); \
		echo "Created $(ENV_FILE) from .env.example. Edit it with your API keys."; \
	else \
		echo "$(ENV_FILE) already exists."; \
		make build;
	fi

build:
	docker compose -f $(COMPOSE_FILE) build

up:
	docker compose -f $(COMPOSE_FILE) up

down:
	docker compose -f $(COMPOSE_FILE) down

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

psql:
	docker exec -it nepaliocr-postgres psql -U postgres -d nepaliocr

backend-shell:
	docker exec -it nepaliocr-backend /bin/bash

frontend-shell:
	docker exec -it nepaliocr-frontend /bin/sh
