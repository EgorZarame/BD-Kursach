package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// loadEnv загружает переменные окружения из .env файла
func loadEnv() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("Файл .env не найден, используем системные переменные окружения")
	}
}

// getEnv возвращает значение переменной окружения или значение по умолчанию
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
