LOCAL_DB_DSN := postgresql://postgres:postgres@localhost:5432/arenda?sslmode=disable

MIGRATIONS_FOLDER := $(CURDIR)/migrations

.PHONY:db-create-migration
db-create-migration:
	goose -dir $(MIGRATIONS_FOLDER) create -s $(name) sql

.PHONY:db-migrate
db-migrate:
	goose -dir $(MIGRATIONS_FOLDER) postgres "$(LOCAL_DB_DSN)" up

.PHONY:db-migrate-down
db-migrate-down:
	goose -dir $(MIGRATIONS_FOLDER) postgres "$(LOCAL_DB_DSN)" down

.PHONY:db-migrate-reset
db-migrate-reset:
	goose -dir $(MIGRATIONS_FOLDER) postgres "$(LOCAL_DB_DSN)" reset
