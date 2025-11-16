package models

// AvailableListing используется в ответе /api/listings/available
type AvailableListing struct {
	ID      int    `json:"id"`
	Type    string `json:"type"`
	City    string `json:"city"`
	Address string `json:"address"`
	Price   string `json:"price"`
	Comment string `json:"comment"`
	UserID  int    `json:"user_id"`
}

// BookingView используется в ответе /api/my-bookings
type BookingView struct {
	ID          int    `json:"id"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	TotalAmount string `json:"total_amount"`
	BuildingID  int    `json:"building_id"`
	Type        string `json:"type"`
	City        string `json:"city"`
	Address     string `json:"address"`
}
