import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export interface GeoFix {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  fixedAt: string;
}

export type GeoStatus = 'INITIALISING' | 'DENIED' | 'DISABLED' | 'SEARCHING' | 'READY' | 'ERROR';

const toFix = (position: Location.LocationObject): GeoFix => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  altitude: position.coords.altitude ?? undefined,
  accuracy: position.coords.accuracy ?? undefined,
  heading: position.coords.heading ?? undefined,
  fixedAt: new Date(position.timestamp).toISOString(),
});

/**
 * Continuous high-accuracy GPS feed for evidence geotagging (Requirement 4.2).
 * Every photograph is stamped with the most recent fix, so the watch stays open for
 * as long as the camera screen is mounted rather than requesting per shot.
 */
export const useGeoFix = () => {
  const [fix, setFix] = useState<GeoFix | undefined>();
  const [status, setStatus] = useState<GeoStatus>('INITIALISING');
  const [error, setError] = useState<string | undefined>();
  const subscription = useRef<Location.LocationSubscription | null>(null);

  const start = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('DENIED');
        setError('Location permission denied. Photos cannot be geotagged.');
        return;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        setStatus('DISABLED');
        setError('Device location services are switched off.');
        return;
      }

      setStatus('SEARCHING');
      setError(undefined);

      // A cached fix gives the surveyor something immediately while the GPS locks on.
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
      if (lastKnown) setFix(toFix(lastKnown));

      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        position => {
          setFix(toFix(position));
          setStatus('READY');
        }
      );
    } catch (err: any) {
      setStatus('ERROR');
      setError(err?.message ?? 'Unable to acquire a GPS fix.');
    }
  }, []);

  useEffect(() => {
    start();
    return () => {
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [start]);

  const retry = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
    setStatus('INITIALISING');
    start();
  }, [start]);

  return { fix, status, error, retry };
};

export const describeGeoStatus = (status: GeoStatus, fix?: GeoFix): string => {
  switch (status) {
    case 'READY':
      return fix?.accuracy !== undefined ? `GPS LOCK ±${Math.round(fix.accuracy)}m` : 'GPS LOCK';
    case 'SEARCHING':
      return fix ? 'REFINING FIX…' : 'ACQUIRING GPS…';
    case 'DENIED':
      return 'GPS PERMISSION DENIED';
    case 'DISABLED':
      return 'LOCATION SERVICES OFF';
    case 'ERROR':
      return 'GPS ERROR';
    default:
      return 'STARTING GPS…';
  }
};
