
import { useEffect, useState } from "react";
import { brand } from "./config/brand";
import "./App.css";
import WorldMap from "./components/WorldMap";
import Achievements from "./components/Achievements";
import TravelHistory from "./components/TravelHistory";


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

const achievements = [
  {
    title: "Nature Explorer",
    description: "Discover the beauty of nature",
    progress: "8 / 10 destinations",
    icon: "🏔️",
  },
  {
    title: "City Discoverer",
    description: "Explore remarkable cities",
    progress: "6 / 10 cities",
    icon: "🏙️",
  },
  {
    title: "Culture Collector",
    description: "Experience cultures around the world",
    progress: "3 / 5 landmarks",
    icon: "🏛️",
  },
];

function App() {
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

  useEffect(() => {
    localStorage.setItem(
      "globemarks-country-statuses",
      JSON.stringify(countryStatuses)
    );
  }, [countryStatuses]);
  useEffect(() => {
    localStorage.setItem(
      "globemarks-country-details",
      JSON.stringify(countryDetails)
    );
  }, [countryDetails]);

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
  ];

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#" aria-label={brand.name}>
          <span className="brand-icon">◎</span>
          <span>{brand.name}</span>
        </a>

        <nav className="nav-links">
          {navigation.map((item) => (
            <button
              key={item}
              className={activePage === item ? "nav-link active" : "nav-link"}
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-button" aria-label="Search">
            ⌕
          </button>
          <button className="profile-avatar" aria-label="User profile">
            SD
          </button>
        </div>
      </header>

      <main className="main-content">
      {activePage === "Travel History" ? (
        <TravelHistory
          countryStatuses={countryStatuses}
          countryDetails={countryDetails}
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

          <button className="primary-button">
            + Add a destination
          </button>
        </section>

        <section className="stats-grid" aria-label="Travel statistics">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
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
      </main>
    </div>
  );
}

export default App;
