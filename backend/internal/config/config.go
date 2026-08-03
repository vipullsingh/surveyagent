package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBConnString string
	JWTSecret    string
	StoragePath  string
	Environment  string
}

func LoadConfig() *Config {
	// Attempt to load .env file if present
	if err := godotenv.Load(".env"); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			fmt.Println("Info: No .env file found, using system environment variables and defaults")
		}
	}

	port := getEnv("PORT", "8080")
	dbConn := getEnv("POSTGRES_DSN", getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/surveyagent?sslmode=disable"))
	jwtSecret := getEnv("JWT_SECRET", "surveyagent-secret-key-super-secure-2026")
	storagePath := getEnv("STORAGE_PATH", "./uploads")
	env := getEnv("APP_ENV", "development")

	return &Config{
		Port:         port,
		DBConnString: dbConn,
		JWTSecret:    jwtSecret,
		StoragePath:  storagePath,
		Environment:  env,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}
