import { useState } from "react";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

type CountryStatus = "visited" | "planned" | "not-visited";

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

type Props = {
  countryStatuses: Record<string, CountryStatus>;
  countryDetails: Record<string, CountryDetails>;
  onBack: () => void;
};

export default function PlacesExplored({
  countryStatuses,
  countryDetails,
  onBack,
}: Props) {
  const [search, setSearch] = useState("");

  const allAttractions = Object.entries(countryDetails)
    .filter(
      ([countryCode]) => countryStatuses[countryCode] === "visited"
    )
    .flatMap(([countryCode, details]) => {
      const alpha2 = countries.numericToAlpha2(countryCode);

      const countryName = alpha2
        ? countries.getName(alpha2, "en") || countryCode
        : countryCode;

      return (details.attractions ?? []).map((attraction) => ({
        ...attraction,
        countryCode,
        countryName,
        flagUrl: alpha2
          ? `https://flagcdn.com/w80/${alpha2.toLowerCase()}.png`
          : "",
      }));
    });

  const filteredAttractions = allAttractions.filter((attraction) => {
    const query = search.trim().toLowerCase();

    return (
      attraction.name.toLowerCase().includes(query) ||
      attraction.city.toLowerCase().includes(query) ||
      attraction.countryName.toLowerCase().includes(query) ||
      attraction.category.toLowerCase().includes(query)
    );
  });

  return (
    <section className="places-explored-page">
      <button
        className="places-back-button"
        onClick={onBack}
      >
        ← Back to My Journey
      </button>

      <div className="places-explored-header">
        <h1>Places Explored</h1>
        <p>
          Discover all the attractions you've visited around
          the world.
        </p>
      </div>

      <div className="places-explored-toolbar">
        <span>
          {filteredAttractions.length} of {allAttractions.length} attractions
        </span>

        <input
          type="search"
          placeholder="Search attractions, cities, countries..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredAttractions.length === 0 ? (
        <p className="places-empty-message">
          {allAttractions.length === 0
            ? "No attractions recorded yet."
            : "No attractions match your search."}
        </p>
      ) : (
        <div className="places-explored-grid">
          {filteredAttractions.map((attraction) => (
            <article
              key={`${attraction.countryCode}-${attraction.id}`}
              className="places-explored-card"
            >
              <div className="places-explored-card-top">
                {attraction.flagUrl && (
                  <img
                    src={attraction.flagUrl}
                    alt={`${attraction.countryName} flag`}
                  />
                )}

                <span>{attraction.countryName}</span>
              </div>

              <h3>{attraction.name}</h3>

              <p className="places-location">
                📍 {attraction.city || "City not specified"}
              </p>

              <span className="places-category">
                {attraction.category}
              </span>

              {attraction.visitDate && (
                <p className="places-date">
                  📅 Visited: {attraction.visitDate}
                </p>
              )}

              <p className="places-rating">
                {"★".repeat(
                  Math.max(0, Math.min(5, Math.floor(attraction.rating || 0)))
                )}
                {"☆".repeat(
                  5 - Math.max(0, Math.min(5, Math.floor(attraction.rating || 0)))
                )}
              </p>

              {attraction.notes && (
                <p className="places-notes">
                  {attraction.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}