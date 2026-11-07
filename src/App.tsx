
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import {
  loadTravelData,
  saveTravelData,
  migrateLocalTravelData,
} from "./lib/travelData";
import { brand } from "./config/brand";
import "./App.css";
import WorldMap from "./components/WorldMap";
import Achievements from "./components/Achievements";
import TravelHistory from "./components/TravelHistory";
import AddDestination from "./components/AddDestination";
import PlacesExplored from "./components/PlacesExplored";
import TravelStatsDetails from "./components/TravelStatsDetails";
import Auth from "./components/Auth";


type CountryStatus = "visited" | "planned" | "not-visited";

type CountryStatuses = Record<string, CountryStatus>;
type Attraction = {
  id: string;
  name: string;
  category: string;
  city: string;
  visitDate: string;
  rating: number;
  notes: string;
};

type CountryDetails = {
  firstVisitDate?: string;
  notes?: string;
  cities?: string[];
  attractions?: Attraction[];
};

type CountryDetailsMap = Record<string, CountryDetails>;

const initialCountryStatuses: CountryStatuses = {
  "050": "visited",      // Bangladesh
  "356": "visited",      // India
  "554": "visited",      // New Zealand
  "036": "planned",      // Australia
  "826": "planned",      // United Kingdom
  "840": "planned",      // United States
};


function normalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJson);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([keyA], [keyB]) => (
          keyA < keyB ? -1 : keyA > keyB ? 1 : 0
        ))
        .map(([key, item]) => [key, normalizeJson(item)])
    );
  }

  return value;
}

function jsonDataMatches(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeJson(a)) ===
    JSON.stringify(normalizeJson(b));
}


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  currentUserIdRef.current = session?.user.id ?? null;
  const [travelDataLoading, setTravelDataLoading] = useState(true);
  const [travelDataError, setTravelDataError] = useState("");
  const [loadedTravelUserId, setLoadedTravelUserId] =
    useState<string | null>(null);
  const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      alert("Unable to log out. Please try again.");
      return;
    }

    setSession(null);
    setActivePage("My Journey");
  };
  
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  const handleMigrateTravelData = async () => {
    if (!session?.user.id || migrationLoading) {
      return;
    }

    const confirmed = window.confirm(
      `Migrate existing browser travel data to ${session.user.email}?\n\n` +
      "This will not delete your local data or backup file."
    );

    if (!confirmed) return;

    setMigrationLoading(true);
    setMigrationMessage("");

    try {
      const statusesRaw = localStorage.getItem(
        "globemarks-country-statuses"
      );

      const detailsRaw = localStorage.getItem(
        "globemarks-country-details"
      );

      if (!statusesRaw || !detailsRaw) {
        throw new Error(
          "Local travel data is missing. Migration cancelled."
        );
      }

      const localData = {
        countryStatuses: JSON.parse(statusesRaw),
        countryDetails: JSON.parse(detailsRaw),
      };

      const result = await migrateLocalTravelData(
        session.user.id,
        localData
      );

      if (result === "already_exists") {
        setMigrationMessage(
          "Cloud data already exists. Nothing was overwritten."
        );
        return;
      }

      const savedData = await loadTravelData(session.user.id);
      
      if (
        !savedData ||
        !jsonDataMatches(
          savedData.countryStatuses,
          localData.countryStatuses
        ) ||
        !jsonDataMatches(
          savedData.countryDetails,
          localData.countryDetails
        )
      ) {
        throw new Error(
          "Cloud verification did not match local data. Keep your backup."
        );
      }


      setMigrationMessage(
        "Migration successful! Travel data verified in Supabase."
      );
    } catch (error) {
      console.error("GlobeMarks migration error:", error);

      setMigrationMessage(
        error instanceof Error ? error.message : "Migration failed."
      );
    } finally {
      setMigrationLoading(false);
    }
  };
  
  const handleVerifyCloudData = async () => {
    if (!session?.user.id || migrationLoading) {
      return;
    }

    setMigrationLoading(true);
    setMigrationMessage("");

    try {
      const statusesRaw = localStorage.getItem(
        "globemarks-country-statuses"
      );

      const detailsRaw = localStorage.getItem(
        "globemarks-country-details"
      );

      if (!statusesRaw || !detailsRaw) {
        throw new Error("Local travel data is missing.");
      }

      const localData = {
        countryStatuses: JSON.parse(statusesRaw),
        countryDetails: JSON.parse(detailsRaw),
      };

      const cloudData = await loadTravelData(session.user.id);

      if (!cloudData) {
        setMigrationMessage(
          "No cloud travel data found for this account."
        );
        return;
      }

      const statusesMatch = jsonDataMatches(
        cloudData.countryStatuses,
        localData.countryStatuses
      );

      const detailsMatch = jsonDataMatches(
        cloudData.countryDetails,
        localData.countryDetails
      );

      if (statusesMatch && detailsMatch) {
        setMigrationMessage(
          "Verified! Cloud and local travel data match."
        );
      } else {
        setMigrationMessage(
          "Cloud and local data differ. No changes were made."
        );

        console.log("Country statuses match:", statusesMatch);
        console.log("Country details match:", detailsMatch);
      }
    } catch (error) {
      console.error("Cloud verification failed:", error);

      setMigrationMessage(
        error instanceof Error
          ? error.message
          : "Cloud verification failed."
      );
    } finally {
      setMigrationLoading(false);
    }
  };
  
  
  const saveTravelChanges = async (
    updatedStatuses: CountryStatuses,
    updatedDetails: CountryDetailsMap
  ): Promise<void> => {
    const userId = session?.user.id;

    if (
      !userId ||
      authLoading ||
      travelDataLoading ||
      loadedTravelUserId !== userId
    ) {
      throw new Error("Travel data is not ready for saving.");
    }

    const performSave = async () => {
      if (currentUserIdRef.current !== userId) {
        throw new Error("Account changed. Save cancelled.");
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || user?.id !== userId) {
        throw new Error("Authentication changed. Save cancelled.");
      }

      if (currentUserIdRef.current !== userId) {
        throw new Error("Account changed. Save cancelled.");
      }

      await saveTravelData(userId, {
        countryStatuses: updatedStatuses,
        countryDetails: updatedDetails,
      });
    };

    const queuedSave = saveQueueRef.current.then(performSave);

    saveQueueRef.current = queuedSave.catch(() => {
      // Keep the queue usable after a failed save.
    });

    return queuedSave;
    void saveTravelChanges;
  };




  const [activePage, setActivePage] = useState("My Journey");
  const [countryStatuses, setCountryStatuses] =
  useState<CountryStatuses>(() => {
    const savedStatuses = localStorage.getItem(
      "globemarks-country-statuses"
    );

    if (savedStatuses) {
      try {
        return JSON.parse(savedStatuses) as CountryStatuses;
      } catch {
        return initialCountryStatuses;
      }
    }

    return initialCountryStatuses;
  });

  const [countryDetails, setCountryDetails] =
  useState<CountryDetailsMap>(() => {
    const savedDetails = localStorage.getItem(
      "globemarks-country-details"
    );

    if (savedDetails) {
      try {
        return JSON.parse(savedDetails) as CountryDetailsMap;
      } catch {
        return {};
      }
    }

    return {};
  });

  const visitedCountriesCount = Object.values(countryStatuses).filter(
    (status) => status === "visited"
  ).length;

  const plannedCountriesCount = Object.values(countryStatuses).filter(
    (status) => status === "planned"
  ).length;

  const placesExploredCount = Object.entries(countryDetails)
    .filter(([countryCode]) => countryStatuses[countryCode] === "visited")
    .reduce(
      (total, [, details]) => total + (details.attractions?.length ?? 0),
      0
    );
  const citiesVisitedCount = Object.entries(countryDetails)
  .filter(([countryCode]) => countryStatuses[countryCode] === "visited")
  .reduce(
    (total, [, details]) => total + (details.cities?.length ?? 0),
    0
  );  

  const stats = [
  {
    label: "Countries visited",
    value: visitedCountriesCount.toString(),
    icon: "🌍",
  },
  {
    label: "Countries planned",
    value: plannedCountriesCount.toString(),
    icon: "✈️",
  },
  {
    label: "Cities visited",
    value: citiesVisitedCount.toString(),
    icon: "🏙️",
  },
  {
    label: "Places explored",
    value: placesExploredCount.toString(),
    icon: "📍",
  },
];
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    const userId = session?.user.id;

    if (authLoading) {
      return;
    }

    // Never display the previous user's travel records.
    setLoadedTravelUserId(null);
    setTravelDataLoading(true);
    setTravelDataError("");

    if (!userId) {
      setCountryStatuses({});
      setCountryDetails({});
      setTravelDataLoading(false);
      return;
    }

    let cancelled = false;

    const fetchTravelData = async () => {
      try {
        const cloudData = await loadTravelData(userId);

        if (cancelled) return;

        if (cloudData) {
          setCountryStatuses(cloudData.countryStatuses);
          setCountryDetails(cloudData.countryDetails);
        } else {
          // New account: no cloud records yet.
          setCountryStatuses({});
          setCountryDetails({});
        }

        setLoadedTravelUserId(userId);
        setTravelDataLoading(false);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load travel data:", error);

        setTravelDataError(
          error instanceof Error
            ? error.message
            : "Unable to load travel data."
        );

        setTravelDataLoading(false);
      }
    };

    void fetchTravelData();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, authLoading]);

  const visitedCountries = Object.values(countryStatuses).filter(
    (status) => status === "visited"
  ).length;

  const allAttractions = Object.values(countryDetails).flatMap(
    (details) => details.attractions ?? []
  );

  const milestoneList = [
    {
      name: "First Explorer",
      description: "Visit your first country.",
      current: visitedCountries,
      target: 1,
      unit: "countries",
      icon: "🌍",
    },
    {
      name: "Globe Trotter",
      description: "Visit 5 different countries.",
      current: visitedCountries,
      target: 5,
      unit: "countries",
      icon: "✈️",
    },
    {
      name: "Nature Lover",
      description: "Explore 10 natural attractions.",
      current: allAttractions.filter(
        (item) => item.category === "Natural Attraction"
      ).length,
      target: 10,
      unit: "attractions",
      icon: "🏞️",
    },
    {
      name: "Heritage Hunter",
      description: "Explore 5 UNESCO heritage sites.",
      current: allAttractions.filter(
        (item) => item.category === "UNESCO Heritage"
      ).length,
      target: 5,
      unit: "heritage sites",
      icon: "🏛️",
    },
  ];

  const nextMilestone = milestoneList.find(
    (item) => item.current < item.target
  );
  const navigation = [
    "Explore",
    "My Journey",
    "Travel History",
    "Achievements",
    "Community",
    ...(session ? ["Logout"] : ["Login / Sign Up"]),
  ];

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#" aria-label={brand.name}>
          <span className="brand-icon">◎</span>
          <span>{brand.name}</span>
        </a>

        <nav className="nav-links">
          {navigation.map((item) => {
            const isAuthButton = item === "Login / Sign Up";

            const isActive = isAuthButton
              ? activePage === "Auth"
              : activePage === item;

            return (
              <button
                key={item}
                className={isActive ? "nav-link active" : "nav-link"}
                onClick={() => {
                  if (item === "Logout") {
                    void handleLogout();
                  } else if (isAuthButton) {
                    setActivePage("Auth");
                  } else {
                    setActivePage(item);
                  }
                }}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <div className="nav-actions">
          <button className="icon-button" aria-label="Search">
            ⌕
          </button>
          <button
            className="profile-avatar"
            aria-label={session ? "Signed-in user" : "Sign in"}
            title={session?.user.email ?? "Sign in"}
            onClick={() => {
              if (!session) {
                setActivePage("Auth");
              }
            }}
          >
            {session?.user.email
              ? session.user.email
                  .split("@")[0]
                  .split(/[._-]/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0].toUpperCase())
                  .join("")
              : "?"}
          </button>
        </div>
      </header>

      <main className="main-content">
        {authLoading || travelDataLoading ? (
          <p>Loading your travel data...</p>
        ) : travelDataError ? (
          <p role="alert">
            Unable to load travel data: {travelDataError}
          </p>
        ) : loadedTravelUserId !== session?.user.id && session ? (
          <p>Waiting for your travel data...</p>
        ) : (
          <>
        <div
          style={{
            padding: "12px 20px",
            marginBottom: "16px",
            background: "#eef6ff",
            borderRadius: "10px",
            fontSize: "14px",
          }}
        >
          {authLoading
            ? "Checking authentication..."
            : session
              ? `Signed in as: ${session.user.email ?? "Unknown user"}`
              : "Not signed in"}
          
          {session && (
            <div style={{ marginBottom: "20px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleMigrateTravelData()}
                disabled={migrationLoading}
              >
                {migrationLoading
                  ? "Migrating travel data..."
                  : "Migrate My Travel Data to Supabase"}
              </button>
              
              <button
                type="button"
                onClick={() => void handleVerifyCloudData()}
                disabled={migrationLoading}
                style={{
                  marginLeft: "12px",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  cursor: migrationLoading ? "wait" : "pointer",
                }}
              >
                Verify Cloud Data
              </button>


              {migrationMessage && (
                <p role="status" style={{ marginTop: "10px" }}>
                  {migrationMessage}
                </p>
              )}
            </div>
          )}
    
        </div>
      {activePage === "Auth" ? (
        <Auth />
      ) : activePage === "Places Explored" ? (
        <PlacesExplored
          countryStatuses={countryStatuses}
          countryDetails={countryDetails}
          onBack={() => setActivePage("My Journey")}
        />
      ) : activePage === "Countries visited" ||
          activePage === "Countries planned" ||
          activePage === "Cities visited" ? (
        <TravelStatsDetails
          page={activePage}
          countryStatuses={countryStatuses}
          countryDetails={countryDetails}
          onBack={() => setActivePage("My Journey")}
        />
      ) : activePage === "Travel History" ? (
        <TravelHistory
          countryStatuses={countryStatuses}
          countryDetails={countryDetails}
        />
      ) : activePage === "Add Destination" ? (
        
      <AddDestination
        onBack={() => setActivePage("My Journey")}
        onSave={(
          countryCode,
          status,
          firstVisitDate,
          city,
          attraction
        ) => {
          setCountryStatuses((previous) => ({
            ...previous,
            [countryCode]: status,
          }));

          if (status === "visited") {
            setCountryDetails((previous) => {
              const existingDetails = previous[countryCode] ?? {};
              const existingCities = existingDetails.cities ?? [];
              const existingAttractions = existingDetails.attractions ?? [];

              const newCity = city.trim();

              const cityAlreadyExists = existingCities.some(
                (existingCity) =>
                  existingCity.toLowerCase() === newCity.toLowerCase()
              );

              const updatedCities =
                newCity && !cityAlreadyExists
                  ? [...existingCities, newCity]
                  : existingCities;

              const attractionAlreadyExists = attraction
              ? existingAttractions.some(
                  (existing) =>
                    existing.name.trim().toLowerCase() ===
                      attraction.name.trim().toLowerCase() &&
                    existing.city.trim().toLowerCase() ===
                      newCity.toLowerCase()
                )
              : false;    
              const newAttraction =
              attraction && !attractionAlreadyExists
                ? {
                    id: crypto.randomUUID(),
                    name: attraction.name,
                    category: attraction.category,
                    city: newCity,
                    visitDate: attraction.visitDate || firstVisitDate,
                    rating: attraction.rating,
                    notes: attraction.notes,
                  }
                : null;

              return {
                ...previous,
                [countryCode]: {
                  ...existingDetails,
                  firstVisitDate:
                    firstVisitDate || existingDetails.firstVisitDate,
                  cities: updatedCities,
                  attractions: newAttraction
                    ? [...existingAttractions, newAttraction]
                    : existingAttractions,
                },
              };
            });
          }

          setActivePage("My Journey");
        }}
      />

      ) : (
        <>
          <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR PERSONAL TRAVEL JOURNAL</p>
            <h1>Your world, your story.</h1>
            <p className="welcome-description">
              {brand.description}
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setActivePage("Add Destination")}
          >
            + Add a destination
          </button>
        </section>

        <section className="stats-grid" aria-label="Travel statistics">
          {stats.map((stat) => (
            <article
              className="stat-card"
              key={stat.label}
              role="button"
              tabIndex={0}
              onClick={() => setActivePage(stat.label)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActivePage(stat.label);
                }
              }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="panel map-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">YOUR ADVENTURES</p>
                <h2>Your world map</h2>
              </div>
              <button className="text-button">View full map ↗</button>
            </div>

            <WorldMap
              countryStatuses={countryStatuses}
              onCountryStatusChange={(countryCode, status) => {
                setCountryStatuses((previous) => ({
                  ...previous,
                  [countryCode]: status,
                }));
              }}
              countryDetails={countryDetails}
              onCountryDetailsChange={(countryCode, details) => {
                setCountryDetails((previous) => ({
                  ...previous,
                  [countryCode]: {
                    ...previous[countryCode],
                    ...details,
                  },
                }));
              }}
            />
          </article>

          <article className="panel milestone-panel">
            <p className="eyebrow">KEEP EXPLORING</p>
            <h2>Your next milestone</h2>

            {nextMilestone ? (
              <>
                <div className="milestone-icon">
                  {nextMilestone.icon}
                </div>

                <h3>{nextMilestone.name}</h3>

                <p className="milestone-description">
                  {nextMilestone.description}
                </p>

                <div className="progress-heading">
                  <span>Progress</span>
                  <strong>
                    {Math.min(nextMilestone.current, nextMilestone.target)} /{" "}
                    {nextMilestone.target}
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        Math.min(
                          (nextMilestone.current / nextMilestone.target) * 100,
                          100
                        )
                      }%`,
                    }}
                  />
                </div>

                <p className="progress-caption">
                  {nextMilestone.target - nextMilestone.current} more{" "}
                  {nextMilestone.unit === "countries"
                    ? nextMilestone.target - nextMilestone.current === 1
                      ? "country"
                      : "countries"
                    : nextMilestone.unit === "attractions"
                      ? nextMilestone.target - nextMilestone.current === 1
                        ? "attraction"
                        : "attractions"
                      : nextMilestone.target - nextMilestone.current === 1
                        ? "heritage site"
                        : "heritage sites"} to go!
                </p>
              </>
            ) : (
              <div className="all-milestones-complete">
                <div className="milestone-icon">🏆</div>
                <h3>All milestones completed!</h3>
                <p>Congratulations! Keep exploring and creating memories.</p>
              </div>
            )}

            <div className="milestone-achievements">
              <Achievements
                countryStatuses={countryStatuses}
                countryDetails={countryDetails}
              />
            </div>
          </article>
        </section>
          </>
        )}

        <footer className="footer">
          <p>© {new Date().getFullYear()} {brand.name}. {brand.tagline}</p>
          <p>Made for explorers everywhere 🌍</p>
        </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
