-- +goose Up
-- +goose StatementBegin

ALTER TABLE buildings ADD COLUMN floor integer;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE buildings DROP COLUMN floor;

-- +goose StatementEnd

