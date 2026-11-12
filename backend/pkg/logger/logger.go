package logger

import (
	"log"
	"os"
)

type Logger struct {
	std *log.Logger
}

var defaultLogger = &Logger{
	std: log.New(os.Stdout, "", log.LstdFlags|log.Lmicroseconds),
}

func Get() *Logger {
	return defaultLogger
}

func Info(v ...any) {
	defaultLogger.std.Println(append([]any{"[INFO]"}, v...)...)
}

func Infof(format string, v ...any) {
	defaultLogger.std.Printf("[INFO] "+format, v...)
}

func Warn(v ...any) {
	defaultLogger.std.Println(append([]any{"[WARN]"}, v...)...)
}

func Warnf(format string, v ...any) {
	defaultLogger.std.Printf("[WARN] "+format, v...)
}

func Error(v ...any) {
	defaultLogger.std.Println(append([]any{"[ERROR]"}, v...)...)
}

func Errorf(format string, v ...any) {
	defaultLogger.std.Printf("[ERROR] "+format, v...)
}

func Fatal(v ...any) {
	defaultLogger.std.Fatal(append([]any{"[FATAL]"}, v...)...)
}

func Fatalf(format string, v ...any) {
	defaultLogger.std.Fatalf("[FATAL] "+format, v...)
}
