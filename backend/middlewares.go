package main

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"strings"
)

func AddRole() fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenString := c.Cookies("session_token")
		if tokenString == "" {
			return c.Next()
		}
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")
		role, err := ParseAndValidateJWT(tokenString)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "Invalid token")
		}
		c.Locals("role", role)
		return c.Next()
	}
}

func ParseAndValidateJWT(tokenString string) (string, error) {
	secret := getEnv("JWT_SECRET", "err!")
	if strings.Contains(secret, "err!") {
		return "", fiber.NewError(fiber.StatusInternalServerError, "OOPS")
	}
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid token claims")
	}
	role, ok := claims["role"].(string)

	return role, err
}
