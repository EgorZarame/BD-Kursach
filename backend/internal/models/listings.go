package models

import "database/sql"

type Listing struct {
	ID          int    `json:"id"`
	Type        string `json:"type"`
	Name        string `json:"name"`
	City        string `json:"city"`
	Address     string `json:"address"`
	Price       string `json:"price"`
	Comment     string `json:"comment"`
	Description string `json:"description"`
	UserComment string `json:"user_comment"`
	UserID      int    `json:"user_id"`
}

type ListingImage struct {
	ID        int    `json:"id"`
	ListingID int    `json:"listing_id"`
	FilePath  string `json:"file_path"`
}

type ListingModel struct {
	DB *sql.DB
}

func (m *ListingModel) Save(listing Listing) (int, error) {
	var id int
	err := m.DB.QueryRow(`
		INSERT INTO buildings (name, city, address, cost_per_day, user_id, description, user_comment)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING building_id
	`, listing.Name, listing.City, listing.Address, listing.Price, listing.UserID, listing.Description, listing.UserComment).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (m *ListingModel) ListLatest(limit int) ([]Listing, error) {
	rows, err := m.DB.Query(`
		SELECT building_id, name, city, address, cost_per_day::text, COALESCE(description,''), COALESCE(user_comment,''), user_id
		FROM buildings
		ORDER BY building_id DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var listings []Listing
	for rows.Next() {
		var l Listing
		if err := rows.Scan(&l.ID, &l.Name, &l.City, &l.Address, &l.Price, &l.Description, &l.UserComment, &l.UserID); err != nil {
			return nil, err
		}
		l.Type = l.Name
		l.Comment = l.Description
		listings = append(listings, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return listings, nil
}

func (m *ListingModel) ListByUserID(userID int) ([]Listing, error) {
	rows, err := m.DB.Query(`
		SELECT building_id, name, city, address, cost_per_day::text, COALESCE(description,''), COALESCE(user_comment,''), user_id
		FROM buildings
		WHERE user_id = $1
		ORDER BY building_id DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var listings []Listing
	for rows.Next() {
		var l Listing
		if err := rows.Scan(&l.ID, &l.Name, &l.City, &l.Address, &l.Price, &l.Description, &l.UserComment, &l.UserID); err != nil {
			return nil, err
		}
		l.Type = l.Name
		l.Comment = l.Description
		listings = append(listings, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return listings, nil
}

// SaveImagePath сохраняет путь к изображению объявления
func (m *ListingModel) SaveImagePath(listingID int, path string) (int, error) {
	var id int
	err := m.DB.QueryRow(`
        INSERT INTO building_images (building_id, file_path)
        VALUES ($1, $2)
        RETURNING image_id
    `, listingID, path).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// ListImages возвращает список изображений объявления
func (m *ListingModel) ListImages(listingID int) ([]ListingImage, error) {
	rows, err := m.DB.Query(`
        SELECT image_id, building_id, file_path
        FROM building_images
        WHERE building_id = $1
        ORDER BY image_id DESC
    `, listingID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []ListingImage
	for rows.Next() {
		var img ListingImage
		if err := rows.Scan(&img.ID, &img.ListingID, &img.FilePath); err != nil {
			return nil, err
		}
		images = append(images, img)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return images, nil
}
