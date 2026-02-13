
import { DeliveryPoint } from '../types';

/**
 * Calculates the distance between two coordinates in km using the Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Optimizes the route using a Nearest Neighbor algorithm.
 * Points without coordinates are appended to the end of the optimized list.
 */
export const optimizeRoute = (points: DeliveryPoint[]): { ordered: DeliveryPoint[]; distance: number } => {
  const withCoords = points.filter(p => p.latitude !== undefined && p.longitude !== undefined);
  const withoutCoords = points.filter(p => p.latitude === undefined || p.longitude === undefined);

  if (withCoords.length <= 1) {
    return { ordered: [...withCoords, ...withoutCoords], distance: 0 };
  }

  const unvisited = [...withCoords];
  const ordered: DeliveryPoint[] = [];
  let totalDistance = 0;

  // Start with the first point provided that has coordinates
  let current = unvisited.shift()!;
  ordered.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = calculateDistance(
        current.latitude!,
        current.longitude!,
        unvisited[i].latitude!,
        unvisited[i].longitude!
      );
      if (d < minDistance) {
        minDistance = d;
        nearestIndex = i;
      }
    }

    totalDistance += minDistance;
    current = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(current);
  }

  return { ordered: [...ordered, ...withoutCoords], distance: totalDistance };
};

/**
 * Generates a Google Maps link. Points without coordinates are ignored for the mapping service.
 */
export const generateGoogleMapsLink = (points: DeliveryPoint[]): string => {
  const validPoints = points.filter(p => p.latitude !== undefined && p.longitude !== undefined);
  
  if (validPoints.length === 0) return '';
  
  const lastPoint = validPoints[validPoints.length - 1];
  const waypoints = validPoints.slice(0, validPoints.length - 1);
  
  const destinationStr = `${lastPoint.latitude},${lastPoint.longitude}`;
  const waypointsStr = waypoints
    .map(p => `${p.latitude},${p.longitude}`)
    .join('|');
    
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destinationStr}&travelmode=driving`;
  
  if (waypointsStr) {
    url += `&waypoints=${waypointsStr}`;
  }
  
  return url;
};
