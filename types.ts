
export interface DeliveryPoint {
  code: string;
  name: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  deliveryAssigned?: string; // Name of the person/vehicle it's assigned to
}

export interface RouteAssignment {
  deliveryName: string;
  codes: string[];
}

export interface OptimizedRoute {
  orderedPoints: DeliveryPoint[];
  totalDistance: number;
  googleMapsLink: string;
  explanation: string;
  estimatedTime: number; // In minutes
}

export interface AppState {
  points: DeliveryPoint[];
  assignments: Record<string, OptimizedRoute>;
  isProcessing: boolean;
  error?: string;
}

export interface AppStats {
  totalPoints: number;
  assignedPoints: number;
  totalEstimatedTime: number; // In minutes
}
