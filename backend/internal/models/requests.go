package models

// ListingRequest описывает входные данные для создания объявления
type ListingRequest struct {
	Type        string `json:"type"`
	City        string `json:"city"`
	Address     string `json:"address"`
	Price       string `json:"price"`
	Description string `json:"description"`
	UserComment string `json:"user_comment"`
	UserEmail   string `json:"user_email"`
}

// CreateBookingRequest описывает запрос на создание бронирования
type CreateBookingRequest struct {
	BuildingID int    `json:"building_id"`
	StartDate  string `json:"start_date"`
	EndDate    string `json:"end_date"`
	Email      string `json:"email"`
}
