package services

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"geofencing/internal/models"
	"geofencing/internal/repositories"
	"geofencing/pkg/logger"
	"geofencing/pkg/utils"
)

type LocationUpdateEvent struct {
	VehicleID string
	Latitude  float64
	Longitude float64
	TimeNs    int64
}

type Dispatcher struct {
	geofenceRepo repositories.GeofenceRepository
	vehicleRepo  repositories.VehicleRepository
	alertRepo    repositories.AlertRepository
	redis        *redis.Client
	wsHub        *WSHub
	eventChan    chan LocationUpdateEvent
}

func NewDispatcher(
	geofenceRepo repositories.GeofenceRepository,
	vehicleRepo repositories.VehicleRepository,
	alertRepo repositories.AlertRepository,
	redisClient *redis.Client,
	wsHub *WSHub,
) *Dispatcher {
	return &Dispatcher{
		geofenceRepo: geofenceRepo,
		vehicleRepo:  vehicleRepo,
		alertRepo:    alertRepo,
		redis:        redisClient,
		wsHub:        wsHub,
		eventChan:    make(chan LocationUpdateEvent, 1000),
	}
}

func (d *Dispatcher) Start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case event := <-d.eventChan:
				d.processLocationUpdate(event)
			}
		}
	}()
}

func (d *Dispatcher) Dispatch(event LocationUpdateEvent) {
	select {
	case d.eventChan <- event:
	default:
		logger.Warn("[DISPATCHER] Event queue full, processing synchronously")
		go d.processLocationUpdate(event)
	}
}

func (d *Dispatcher) processLocationUpdate(event LocationUpdateEvent) {
	if d.vehicleRepo == nil || d.geofenceRepo == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	vehicle, err := d.vehicleRepo.FindByID(ctx, event.VehicleID)
	if err != nil || vehicle == nil {
		logger.Errorf("[DISPATCHER] Vehicle %s not found: %v", event.VehicleID, err)
		return
	}

	geofences, err := d.geofenceRepo.FindAll(ctx)
	if err != nil {
		logger.Errorf("[DISPATCHER] Failed to fetch active geofences: %v", err)
		return
	}

	for _, g := range geofences {
		if g.Status != "active" {
			continue
		}

		isInsideNow := IsPointInPolygon(event.Latitude, event.Longitude, g.Coordinates)
		wasInside := d.getPreviousState(ctx, event.VehicleID, g.ID)

		var eventType string
		if !wasInside && isInsideNow {
			eventType = "entry"
		} else if wasInside && !isInsideNow {
			eventType = "exit"
		}

		d.saveState(ctx, event.VehicleID, g.ID, isInsideNow)

		if eventType != "" {
			// Check if an active alert rule allows this notification
			if d.alertRepo != nil {
				hasRule, _ := d.alertRepo.HasMatchingRule(ctx, g.ID, event.VehicleID, eventType)
				if !hasRule {
					logger.Infof("[DISPATCHER] Event %s for Geofence %s dropped (no active alert rule)", eventType, g.ID)
					continue
				}
			}

			alertID := utils.NewAlertID()
			now := time.Now()

			if d.alertRepo != nil {
				violation := &models.Violation{
					ID:            alertID,
					GeofenceID:    g.ID,
					GeofenceName:  g.Name,
					VehicleID:     event.VehicleID,
					VehicleNumber: vehicle.VehicleNumber,
					DriverName:    vehicle.DriverName,
					EventType:     eventType,
					Latitude:      event.Latitude,
					Longitude:     event.Longitude,
					Status:        "active",
					CreatedAt:     now,
				}
				if err := d.alertRepo.CreateViolation(ctx, violation); err != nil {
					logger.Errorf("[DISPATCHER] Failed to persist violation: %v", err)
				}
			}

			if d.wsHub != nil {
				d.wsHub.Broadcast(models.WsEvent{
					EventID:   utils.NewEventID(),
					EventType: eventType,
					Timestamp: now,
					Vehicle: models.WsVehicle{
						VehicleID:     event.VehicleID,
						VehicleNumber: vehicle.VehicleNumber,
						DriverName:    vehicle.DriverName,
					},
					Geofence: &models.WsGeofence{
						GeofenceID:   g.ID,
						GeofenceName: g.Name,
						Category:     g.Category,
					},
					Location: models.WsLocation{
						Latitude:  event.Latitude,
						Longitude: event.Longitude,
					},
				})
			}

			logger.Infof("[ALERT] Vehicle %s (%s) triggered %s for Geofence %s (%s)",
				vehicle.VehicleNumber, event.VehicleID, eventType, g.Name, g.ID)
		}
	}
}

func (d *Dispatcher) getPreviousState(ctx context.Context, vehicleID, geofenceID string) bool {
	if d.redis != nil {
		key := fmt.Sprintf("vehicle_geofence:%s:%s", vehicleID, geofenceID)
		val, err := d.redis.Get(ctx, key).Result()
		if err == nil {
			return val == "inside"
		}
	}

	if d.alertRepo != nil {
		lastEventType, err := d.alertRepo.GetLastEventType(ctx, vehicleID, geofenceID)
		if err == nil && lastEventType == "entry" {
			return true
		}
	}

	return false
}

func (d *Dispatcher) saveState(ctx context.Context, vehicleID, geofenceID string, inside bool) {
	if d.redis != nil {
		key := fmt.Sprintf("vehicle_geofence:%s:%s", vehicleID, geofenceID)
		state := "outside"
		if inside {
			state = "inside"
		}
		_ = d.redis.Set(ctx, key, state, 24*time.Hour).Err()
	}
}

// IsPointInPolygon uses Ray-Casting algorithm to check if (lat, lon) is within polygon.
func IsPointInPolygon(lat, lon float64, polygon [][2]float64) bool {
	n := len(polygon)
	if n < 3 {
		return false
	}

	inside := false
	j := n - 1
	for i := 0; i < n; i++ {
		xi, yi := polygon[i][0], polygon[i][1]
		xj, yj := polygon[j][0], polygon[j][1]

		intersect := ((yi > lon) != (yj > lon)) &&
			(lat < (xj-xi)*(lon-yi)/(yj-yi)+xi)
		if intersect {
			inside = !inside
		}
		j = i
	}
	return inside
}
