export type NeighbourhoodGroup = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";

export interface PredictRequest {
  latitude: number;
  longitude: number;
  price: number;
  minimum_nights: number;
  number_of_reviews: number;
  reviews_per_month: number;
  calculated_host_listings_count: number;
  availability_365: number;
  neighbourhood_group: NeighbourhoodGroup;
  neighbourhood: string;
}

export interface PredictResponse {
  room_type: "Entire home/apt" | "Private room" | "Shared room";
  confidence: number;
  probabilities: {
    "Entire home/apt": number;
    "Private room": number;
    "Shared room": number;
  };
}

export interface HealthResponse {
  status: string;
}

export interface MetadataResponse {
  model_version?: string;
  version?: string;
  model_name?: string;
  status?: string;
  [key: string]: any;
}