-- +goose Up
-- +goose StatementBegin

INSERT INTO roles (id, role_name) VALUES
                                       (1, 'user'),
                                       (2, 'admin'),
                                       (3, 'owner'),
                                       (4, 'renter');

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- +goose StatementEnd
