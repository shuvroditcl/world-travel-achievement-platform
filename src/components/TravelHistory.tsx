
import { useState } from "react";
import * as countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

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

type TravelHistoryProps = {
  countryStatuses: Record<string, string>;
  countryDetails: Record<string, CountryDetails>;
};

function getCountryInfo(code: string) {
  const alpha2 = countries.numericToAlpha2(code);

  const name =
    countries.getName(alpha2 || "", "en") ||
    `Country ${code}`;

  const flagUrl = alpha2
    ? `https://flagcdn.com/w80/${alpha2.toLowerCase()}.png`
    : "";

  return { name, flagUrl };
}

function getCategoryIcon(category: string) {
  if (category === "Natural Attraction") return "🌿";
  if (category === "UNESCO Heritage") return "🏛️";
  if (category === "Landmark") return "📍";
  return "✨";
}

function TravelHistory({
  countryStatuses,
  countryDetails,
}: TravelHistoryProps) {
const [search, setSearch] = useState("");
const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
const [expandedCities, setExpandedCities] = useState<string[]>([]);
const [expandedMemories, setExpandedMemories] = useState<string[]>([]);

const toggleMemories = (countryCode: string) => {
  setExpandedMemories((previous) =>
    previous.includes(countryCode)
      ? previous.filter((code) => code !== countryCode)
      : [...previous, countryCode]
  );
};

const toggleCities = (countryCode: string) => {
  setExpandedCities((previous) =>
    previous.includes(countryCode)
      ? previous.filter((code) => code !== countryCode)
      : [...previous, countryCode]
  );
};

  const toggleCountry = (countryCode: string) => {
    setExpandedCountries((previous) =>
        previous.includes(countryCode)
        ? previous.filter((code) => code !== countryCode)
        : [...previous, countryCode]
    );
  };

  const visitedCountries = Object.entries(countryStatuses)
    .filter(([, status]) => status === "visited")
    .map(([code]) => ({
      code,
      ...getCountryInfo(code),
      details: countryDetails[code] ?? {},
    }))
    .filter(({ name, details }) => {
      const query = search.trim().toLowerCase();

      return (
        name.toLowerCase().includes(query) ||
        details.cities?.some((city) =>
          city.toLowerCase().includes(query)
        ) ||
        details.attractions?.some((attraction) =>
          [attraction.name, attraction.city, attraction.category]
            .some((value) => value.toLowerCase().includes(query))
        )
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="travel-history">
      <div className="travel-history-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL TRAVEL JOURNAL</p>
          <h2>My Travel History</h2>
          <p>Every destination has a story worth remembering.</p>
        </div>

        <span className="history-count">
          🌍 {visitedCountries.length} countries
        </span>
      </div>

      <div className="history-search">
        <span aria-hidden="true">🔎</span>
        <input
          type="search"
          placeholder="Search countries, cities or attractions..."
          aria-label="Search travel history"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {visitedCountries.length === 0 ? (
        <div className="history-empty">
          <span>🧭</span>
          <h3>No matching journeys</h3>
          <p>Try another search or add a visited country.</p>
        </div>
      ) : (
        <div className="travel-history-list">
          {visitedCountries.map(({ code, name, flagUrl, details }) => (
            <article className="travel-history-card" key={code}>
              <div className="history-card-header">
                <div className="history-country">
                  <div className="history-flag-container">
                    {flagUrl ? (
                        <img
                        src={flagUrl}
                        alt={`${name} flag`}
                        className="history-flag-image"
                        loading="lazy"
                        />
                    ) : (
                        <span>🌍</span>
                    )}
                    </div>
                  <div>
                    <h3>{name}</h3>
                    <p>
                      📅 First visited:{" "}
                      {details.firstVisitDate || "Not recorded"}
                    </p>
                  </div>
                </div>
                <span className="history-visited-badge">
                  ✓ Visited
                </span>
              </div>

              <div className="history-card-body">
                <div className="history-stats">
                  <div className="history-stat">
                    <strong>{details.cities?.length ?? 0}</strong>
                    <span>🏙️ Cities visited</span>
                  </div>
                  <div className="history-stat">
                    <strong>{details.attractions?.length ?? 0}</strong>
                    <span>📍 Attractions</span>
                  </div>
                </div>

                
                <div className="history-section">
                <h4>🏙️ Cities explored</h4>

                {details.cities?.length ? (
                    <>
                    <button
                        type="button"
                        className="history-expand-button"
                        onClick={() => toggleCities(code)}
                        aria-expanded={expandedCities.includes(code)}
                    >
                        <span>
                        {expandedCities.includes(code)
                            ? "Hide cities"
                            : `Expand to see ${details.cities.length} ${
                                details.cities.length === 1 ? "city" : "cities"
                            }`}
                        </span>

                        <span aria-hidden="true">
                        {expandedCities.includes(code) ? "▲" : "▼"}
                        </span>
                    </button>

                    {expandedCities.includes(code) && (
                        <div className="history-city-tags history-expanded-cities">
                        {details.cities.map((city, index) => (
                            <span className="history-city-tag" key={index}>
                            {city}
                            </span>
                        ))}
                        </div>
                    )}
                    </>
                ) : (
                    <p className="history-muted">
                    No cities recorded yet.
                    </p>
                )}
                </div>


                
                <div className="history-section">
                <h4>📍 Attractions explored</h4>

                {details.attractions?.length ? (
                    <>
                    <button
                        type="button"
                        className="history-expand-button"
                        onClick={() => toggleCountry(code)}
                        aria-expanded={expandedCountries.includes(code)}
                    >
                        <span>
                        {expandedCountries.includes(code)
                            ? "Hide attractions"
                            : `Expand to see ${details.attractions.length} ${
                                details.attractions.length === 1
                                ? "attraction"
                                : "attractions"
                            }`}
                        </span>

                        <span aria-hidden="true">
                        {expandedCountries.includes(code) ? "▲" : "▼"}
                        </span>
                    </button>

                    {expandedCountries.includes(code) && (
                        <div className="history-attractions">
                        {details.attractions.map((attraction) => (
                            <div
                            className="history-attraction"
                            key={attraction.id}
                            >
                            <div className="history-attraction-top">
                                <strong>
                                {getCategoryIcon(attraction.category)}{" "}
                                {attraction.name}
                                </strong>

                                <span className="history-category">
                                {attraction.category}
                                </span>
                            </div>

                            {attraction.city && (
                                <p>📍 {attraction.city}</p>
                            )}

                            {attraction.visitDate && (
                                <p>📅 {attraction.visitDate}</p>
                            )}

                            {attraction.rating > 0 && (
                                <p>⭐ {attraction.rating}/5</p>
                            )}

                            {attraction.notes && (
                                <p className="history-attraction-notes">
                                {attraction.notes}
                                </p>
                            )}
                            </div>
                        ))}
                        </div>
                    )}
                    </>
                ) : (
                    <p className="history-muted">
                    No attractions recorded yet.
                    </p>
                )}
                </div>


                {details.notes && (
                <div className="history-section">
                    <h4>✍️ Travel memories</h4>

                    <button
                    type="button"
                    className="history-expand-button"
                    onClick={() => toggleMemories(code)}
                    aria-expanded={expandedMemories.includes(code)}
                    >
                    <span>
                        {expandedMemories.includes(code)
                        ? "Hide travel memories"
                        : "Read travel memories"}
                    </span>

                    <span aria-hidden="true">
                        {expandedMemories.includes(code) ? "▲" : "▼"}
                    </span>
                    </button>

                    {expandedMemories.includes(code) && (
                    <div className="history-memories">
                        <p>{details.notes}</p>
                    </div>
                    )}
                </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TravelHistory;
