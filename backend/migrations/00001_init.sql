-- +goose Up
-- +goose StatementBegin
CREATE TABLE roles
(
    id        SERIAL,
    role_name text,
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE users
(
    user_id    SERIAL,
    email      text,
    password   text,
    role_id    integer,
    first_name  text,
    last_name   text,
    patronymic text,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id)
        REFERENCES roles (id)
);
CREATE TABLE buildings
(
    building_id  SERIAL,
    name         text,
    address      text,
    city         text,
    cost_per_day numeric,
    user_id      integer,
    description  text,
    user_comment text,
    CONSTRAINT buildings_pkey PRIMARY KEY (building_id),
    CONSTRAINT buildings_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (user_id)
);

CREATE TABLE building_images
(
    image_id    SERIAL,
    building_id integer NOT NULL,
    file_path   text    NOT NULL,
    CONSTRAINT building_images_pkey PRIMARY KEY (image_id),
    CONSTRAINT building_images_building_id_fkey FOREIGN KEY (building_id)
        REFERENCES buildings (building_id) ON DELETE CASCADE
);


CREATE TABLE rent
(
    rent_id      SERIAL,
    start_date   date,
    end_date     date,
    total_amount numeric,
    user_id      integer,
    building_id  integer,
    CONSTRAINT rent_pkey PRIMARY KEY (rent_id),
    CONSTRAINT rent_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (user_id),
    CONSTRAINT rent_building_id_fkey FOREIGN KEY (building_id)
        REFERENCES buildings (building_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE rent;
DROP TABLE building_images;
DROP TABLE buildings;
DROP TABLE users;
DROP TABLE roles;

-- +goose StatementEnd
