
import { useState } from "react";
import * as countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

type AttractionInput = {
  name: string;
  category: string;
  visitDate: string;
  rating: number;
  notes: string;
};

type AddDestinationProps = {
  onBack: () => void;
  onSave: (
    countryCode: string,
    status: "visited" | "planned",
    firstVisitDate: string,
    city: string,
    attraction: AttractionInput | null
  ) => Promise<void>;
};

function AddDestination({ onBack, onSave }: AddDestinationProps) {
  const [countryCode, setCountryCode] = useState("");
  const [status, setStatus] = useState<"visited" | "planned">("visited");
  const [firstVisitDate, setFirstVisitDate] = useState("");
  const [city, setCity] = useState("");
  const [attractionName, setAttractionName] = useState("");
  const [attractionCategory, setAttractionCategory] = useState("Landmark");
  const [attractionRating, setAttractionRating] = useState(5);
  const [attractionNotes, setAttractionNotes] = useState("");
  const [attractionVisitDate, setAttractionVisitDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const countryOptions = Object.entries(
    countries.getNames("en", { select: "official" })
    )
    .map(([alpha2, name]) => ({
        code: countries.alpha2ToNumeric(alpha2),
        name,
    }))
    .filter(
        (country): country is { code: string; name: string } =>
        typeof country.code === "string" &&
        /^\d{3}$/.test(country.code)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="panel add-destination-page">
      <div className="add-destination-header">
        <p className="eyebrow">YOUR NEXT ADVENTURE</p>
        <h2>Add a Destination</h2>
        <p>Start recording your journeys around the world.</p>
      </div>

      <form
        className="add-destination-form"
        
        onSubmit={async (event) => {
          event.preventDefault();

          if (!countryCode || isSaving) {
            return;
          }

          setIsSaving(true);
          setSaveError("");

          try {
            await onSave(
              countryCode,
              status,
              firstVisitDate,
              city.trim(),
              status === "visited" && attractionName.trim()
                ? {
                    name: attractionName.trim(),
                    category: attractionCategory,
                    visitDate: attractionVisitDate,
                    rating: attractionRating,
                    notes: attractionNotes.trim(),
                  }
                : null
            );
          } catch (error) {
            console.error("Failed to save destination:", error);

            setSaveError(
              error instanceof Error
                ? error.message
                : "Unable to save destination. Please try again."
            );
          } finally {
            setIsSaving(false);
          }
        }}

        >
        <label htmlFor="destination-country">Country</label>
        <select
          id="destination-country"
          value={countryCode}
          onChange={(event) => {
        const selectedCode = event.target.value;
        const selectedCountry = countryOptions.find(
            (country) => country.code === selectedCode
        );

        console.log("Selected country:", selectedCountry);
        setCountryCode(selectedCode);
        }}
          required
        >
          <option value="">Select a country</option>
          {countryOptions.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>

        <fieldset className="destination-status-fieldset">
        <legend>Travel status</legend>

        <div className="destination-status-options">
            <label
            className={`destination-status-option ${
                status === "visited" ? "selected" : ""
            }`}
            >
            <input
                type="radio"
                name="travel-status"
                value="visited"
                checked={status === "visited"}
                onChange={() => setStatus("visited")}
            />
            <span>🌍 Visited</span>
            </label>

            <label
            className={`destination-status-option ${
                status === "planned" ? "selected" : ""
            }`}
            >
            <input
                type="radio"
                name="travel-status"
                value="planned"
                checked={status === "planned"}
                onChange={() => setStatus("planned")}
            />
            <span>✈️ Planned</span>
            </label>
        </div>
        </fieldset>
        {status === "visited" && (
        <>
            <label htmlFor="destination-city">
            City visited (optional)
            </label>

            <input
            id="destination-city"
            type="text"
            placeholder="e.g. Tokyo, Auckland, Dhaka"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={100}
            />
        </>
        )}

        {status === "visited" && (
          <>
            <label htmlFor="destination-date">
              First visit date (optional)
            </label>
            <input
              id="destination-date"
              type="date"
              value={firstVisitDate}
              onChange={(event) =>
                setFirstVisitDate(event.target.value)
              }
            />
          </>
        )}
        {status === "visited" && (
        <div className="destination-attraction-fields">
            <h3>📍 Attraction details (optional)</h3>

            <label htmlFor="attraction-name">Attraction name</label>
            <input
            id="attraction-name"
            type="text"
            placeholder="e.g. Tokyo Tower"
            value={attractionName}
            onChange={(event) => setAttractionName(event.target.value)}
            />

            <label htmlFor="attraction-category">Category</label>
            <select
            id="attraction-category"
            value={attractionCategory}
            onChange={(event) => setAttractionCategory(event.target.value)}
            >
            <option value="Landmark">Landmark</option>
            <option value="Natural Attraction">Natural Attraction</option>
            <option value="UNESCO Heritage">UNESCO Heritage</option>
            <option value="Museum">Museum</option>
            <option value="Cultural Attraction">Cultural Attraction</option>
            <option value="Other">Other</option>
            </select>

            <label htmlFor="attraction-visit-date">
              Attraction visit date (optional)
            </label>

            <input
              id="attraction-visit-date"
              type="date"
              value={attractionVisitDate}
              onChange={(event) => setAttractionVisitDate(event.target.value)}
            />
            <label htmlFor="attraction-rating">Your rating</label>
            <select
            id="attraction-rating"
            value={attractionRating}
            onChange={(event) =>
                setAttractionRating(Number(event.target.value))
            }
            >
            {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>
                {"⭐".repeat(rating)} ({rating}/5)
                </option>
            ))}
            </select>

            <label htmlFor="attraction-notes">Attraction notes</label>
            <textarea
            id="attraction-notes"
            rows={3}
            placeholder="What made this place memorable?"
            value={attractionNotes}
            onChange={(event) => setAttractionNotes(event.target.value)}
            />
        </div>
        )}
        
        <div className="add-destination-actions">
          <button
            type="button"
            className="text-button"
            onClick={onBack}
            disabled={isSaving}
          >
            ← Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Destination"}
          </button>
        </div>

        {saveError && (
          <p
            role="alert"
            style={{
              color: "#b42318",
              marginTop: "12px",
            }}
          >
            {saveError}
          </p>
        )}

      </form>
    </section>
  );
}

export default AddDestination;
