
import { supabase } from "./supabase";

export type CountryStatus = "visited" | "planned" | "not-visited";

export type CountryStatuses = Record<string, CountryStatus>;

export type Attraction = {
  id: string;
  name: string;
  category: string;
  city: string;
  visitDate: string;
  rating: number;
  notes: string;
};

export type CountryDetails = {
  firstVisitDate?: string;
  notes?: string;
  cities?: string[];
  attractions?: Attraction[];
};

export type CountryDetailsMap = Record<string, CountryDetails>;

export type TravelData = {
  countryStatuses: CountryStatuses;
  countryDetails: CountryDetailsMap;
};

export async function loadTravelData(
  userId: string
): Promise<TravelData | null> {
  const { data, error } = await supabase
    .from("user_travel_data")
    .select("country_statuses, country_details")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    countryStatuses: data.country_statuses as CountryStatuses,
    countryDetails: data.country_details as CountryDetailsMap,
  };
}

export async function saveTravelData(
  userId: string,
  travelData: TravelData
): Promise<void> {
  const { error } = await supabase
    .from("user_travel_data")
    .upsert(
      {
        user_id: userId,
        country_statuses: travelData.countryStatuses,
        country_details: travelData.countryDetails,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(error.message);
  }
}


export async function migrateLocalTravelData(
  userId: string,
  travelData: TravelData
): Promise<"migrated" | "already_exists"> {
  const { data, error } = await supabase
    .from("user_travel_data")
    .insert({
      user_id: userId,
      country_statuses: travelData.countryStatuses,
      country_details: travelData.countryDetails,
      updated_at: new Date().toISOString(),
    })
    .select("user_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return "already_exists";
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Migration did not return a saved record.");
  }

  return "migrated";
}

