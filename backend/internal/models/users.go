package models

import (
	"database/sql"
	"errors"
)

type User struct {
	ID         int
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Patronymic string `json:"patronymic"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	RoleName   string `json:"role"`
	RoleID     int    `json:"role_id"`
}

type UserModel struct {
	DB *sql.DB
}

// Insert This will insert a new snippet into the database.
func (m *UserModel) Insert(firstName, lastName, patronymic, email, hashedPassword string, roleID int) error {
	_, err := m.DB.Exec(`
		INSERT INTO users (first_name, last_name, patronymic, email, password, role_id)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		firstName, lastName, patronymic, email, hashedPassword, roleID,
	)

	return err
}

func (m *UserModel) FindByEmail(email string) (*User, error) {
	// Явно выбираем колонки в ожидаемом порядке
	stmt := `SELECT user_id, first_name, last_name, patronymic, email, password, role_id FROM users WHERE email = $1`
	row := m.DB.QueryRow(stmt, email)

	u := &User{}

	err := row.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Patronymic, &u.Email, &u.Password, &u.RoleID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRecord
		}
		return nil, err
	}
	return u, nil
}

func (m *UserModel) GetRoleNameByEmail(email string) (string, error) {
	// Явно выбираем колонки в ожидаемом порядке
	stmt := `SELECT r.role_name
	FROM users u
	JOIN roles r ON u.role_id = r.id
	WHERE u.email = $1;`
	row := m.DB.QueryRow(stmt, email)

	userRoleName := ""
	err := row.Scan(&userRoleName)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrNoRecord
		}
		return "", err
	}
	return userRoleName, nil
}
