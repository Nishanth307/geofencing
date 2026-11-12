package config

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config stores all configuration of the application.
// Values are read by viper from a config file or environment variable.
// The `mapstructure` tag must match the key name in app.env / os.Environ.
type Config struct {
	Port string `mapstructure:"PORT"`

	PostgresHost     string `mapstructure:"POSTGRES_HOST"`
	PostgresPort     string `mapstructure:"POSTGRES_PORT"`
	PostgresUser     string `mapstructure:"POSTGRES_USER"`
	PostgresPassword string `mapstructure:"POSTGRES_PASSWORD"`
	PostgresDB       string `mapstructure:"POSTGRES_DB"`
	PostgresSSLMode  string `mapstructure:"POSTGRES_SSLMODE"`
	PostgresDSN      string `mapstructure:"POSTGRES_DSN"` // optional override

	RedisHost     string `mapstructure:"REDIS_HOST"`
	RedisPort     string `mapstructure:"REDIS_PORT"`
	RedisPassword string `mapstructure:"REDIS_PASSWORD"`
	RedisDB       int    `mapstructure:"REDIS_DB"`
}

// PostgresConnectionString builds a DSN from individual fields unless POSTGRES_DSN is set directly.
func (c Config) PostgresConnectionString() string {
	if c.PostgresDSN != "" {
		return c.PostgresDSN
	}
	if c.PostgresPassword != "" {
		return fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			c.PostgresUser, c.PostgresPassword,
			c.PostgresHost, c.PostgresPort,
			c.PostgresDB, c.PostgresSSLMode,
		)
	}
	return fmt.Sprintf(
		"postgres://%s@%s:%s/%s?sslmode=%s",
		c.PostgresUser, c.PostgresHost, c.PostgresPort,
		c.PostgresDB, c.PostgresSSLMode,
	)
}

// RedisAddr returns "host:port" for the Redis client.
func (c Config) RedisAddr() string {
	return fmt.Sprintf("%s:%s", c.RedisHost, c.RedisPort)
}

// LoadConfig reads configuration from an app.env / .env file at `path`, then
// automatically overlays any matching OS environment variables on top —
// environment variables always win (12-factor style).
func LoadConfig(path string) (config Config, err error) {
	v := viper.New()

	// Explicitly bind all environment keys so v.Unmarshal respects OS environment variables
	keys := []string{
		"PORT",
		"POSTGRES_HOST",
		"POSTGRES_PORT",
		"POSTGRES_USER",
		"POSTGRES_PASSWORD",
		"POSTGRES_DB",
		"POSTGRES_SSLMODE",
		"POSTGRES_DSN",
		"REDIS_HOST",
		"REDIS_PORT",
		"REDIS_PASSWORD",
		"REDIS_DB",
	}
	for _, k := range keys {
		_ = v.BindEnv(k)
	}

	// AutomaticEnv makes viper check os.Environ for every key
	v.AutomaticEnv()

	// Default values
	v.SetDefault("PORT", "8080")
	v.SetDefault("POSTGRES_HOST", "localhost")
	v.SetDefault("POSTGRES_PORT", "5432")
	v.SetDefault("POSTGRES_USER", "geofencing")
	v.SetDefault("POSTGRES_DB", "geofencing")
	v.SetDefault("POSTGRES_SSLMODE", "disable")
	v.SetDefault("REDIS_HOST", "localhost")
	v.SetDefault("REDIS_PORT", "6379")
	v.SetDefault("REDIS_DB", 0)

	// Look for app.env first, then .env
	v.AddConfigPath(path)
	v.SetConfigName("app")
	v.SetConfigType("env")

	if err = v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Try .env as fallback
			v.SetConfigName(".env")
			_ = v.ReadInConfig()
		}
	}

	err = v.Unmarshal(&config)
	return
}
