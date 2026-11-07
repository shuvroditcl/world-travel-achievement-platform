import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

type CountryStatus = "visited" | "planned" | "not-visited";

type CountryDetails = {
  firstVisitDate?: string;
  notes?: string;
  cities?: string[];
  attractions?: {
    id: string;
    name: string;
    category: string;
    city: string;
    visitDate: string;
    rating: number;
    notes: string;
  }[];
};

type Props = {
  page: "Countries visited" | "Countries planned" | "Cities visited";
  countryStatuses: Record<string, CountryStatus>;
  countryDetails: Record<string, CountryDetails>;
  onBack: () => void;
};

export default function TravelStatsDetails({
  page,
  countryStatuses,
  countryDetails,
  onBack,
}: Props) {
  const countryList = Object.entries(countryStatuses)
    .filter(([, status]) =>
      page === "Countries planned"
        ? status === "planned"
        : status === "visited"
    )
    .map(([code]) => {
      const alpha2 = countries.numericToAlpha2(code);
      return {
        code,
        name: alpha2
          ? countries.getName(alpha2, "en") || code
          : code,
        flagUrl: alpha2
          ? `https://flagcdn.com/w80/${alpha2.toLowerCase()}.png`
          : "",
        details: countryDetails[code],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const cityList = countryList.flatMap((country) =>
    [...new Set(country.details?.cities ?? [])].map((city) => ({
      city,
      countryName: country.name,
      flagUrl: country.flagUrl,
    }))
  );

  const isCitiesPage = page === "Cities visited";
  const count = isCitiesPage ? cityList.length : countryList.length;

  return (
    <section className="travel-stats-details-page">
      <button className="places-back-button" onClick={onBack}>
        ← Back to My Journey
      </button>

      <div className="places-explored-header">
        <h1>{page}</h1>
        <p>
          {count} {isCitiesPage ? "cities" : "countries"} recorded
        </p>
      </div>

      <div className="travel-stats-details-grid">
        {isCitiesPage
          ? cityList.map((item, index) => (
              <article
                className="travel-stats-details-card"
                key={`${item.countryName}-${item.city}-${index}`}
              >
                <div className="travel-stats-country">
                  {item.flagUrl && (
                    <img src={item.flagUrl} alt="" />
                  )}
                  <span>{item.countryName}</span>
                </div>
                <h3>{item.city}</h3>
              </article>
            ))
          : countryList.map((country) => (
              <article
                className="travel-stats-details-card"
                key={country.code}
              >
                <div className="travel-stats-country">
                  {country.flagUrl && (
                    <img
                      src={country.flagUrl}
                      alt={`${country.name} flag`}
                    />
                  )}
                </div>

                <h3>{country.name}</h3>

                {page === "Countries visited" && (
                  <>
                    <p>
                      🏙️ {country.details?.cities?.length ?? 0} cities
                    </p>
                    <p>
                      📍 {country.details?.attractions?.length ?? 0} attractions
                    </p>
                    {country.details?.firstVisitDate && (
                      <p>
                        📅 First visited: {country.details.firstVisitDate}
                      </p>
                    )}
                  </>
                )}

                {page === "Countries planned" && (
                  <p>✈️ On your travel wishlist</p>
                )}
              </article>
            ))}
      </div>

      {count === 0 && (
        <p className="places-empty-message">
          Nothing recorded here yet.
        </p>
      )}
    </section>
  );
}