package models

import (
	"database/sql"
	"errors"
)

type Role struct {
	ID       int
	RoleName int `json:"role_name"`
}

type RoleModel struct {
	DB *sql.DB
}

func (m *RoleModel) FindByName(roleName string) (int, error) {
	stmt := `SELECT * FROM roles WHERE role_name = $1`
	row := m.DB.QueryRow(stmt, roleName)

	r := &Role{}

	err := row.Scan(&r.ID, &r.RoleName)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 1, ErrNoRecord
		}
		return 1, err
	}
	return r.ID, nil
}
