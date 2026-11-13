
import * as countries from "i18n-iso-countries";
import { geoMercator, geoPath } from "d3-geo";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useEffect, useState } from "react";
import "./WorldMap.css";

type CountryStatus = "visited" | "planned" | "not-visited";

interface Attraction {
  id: string;
  name: string;
  category: string;
  city: string;
  visitDate: string;
  rating: number;
  notes: string;
}

interface CountryDetails {
  firstVisitDate?: string;
  notes?: string;
  cities?: string[];
  attractions?: Attraction[];
}

interface WorldMapProps {
  countryStatuses: Record<string, CountryStatus>;

  onCountryStatusChange: (
    countryCode: string,
    status: CountryStatus
  ) => Promise<void>;

  countryDetails: Record<string, CountryDetails>;

  onCountryDetailsChange: (
    countryCode: string,
    details: CountryDetails
  ) => void;

  onSaveCountryDetails?: (
    countryCode: string,
    details: CountryDetails
  ) => Promise<void>;
}

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  export default function WorldMap({
    countryStatuses,
    onCountryStatusChange,
    countryDetails,
    onCountryDetailsChange,
    onSaveCountryDetails,
  }: WorldMapProps) {
  const handleSaveCountryDetails = async () => {
    if (
      !selectedCountryCode ||
      !onSaveCountryDetails ||
      isSavingDetails ||
      isSavingStatus
    ) {
      return;
    }

    const countryCode = selectedCountryCode;
    const details = countryDetails[countryCode] ?? {};

    setIsSavingDetails(true);

    try {
      await onSaveCountryDetails(countryCode, details);

      setHasUnsavedDetails(false);
      setUnsavedCountryCode(null);
    } catch (error) {
      console.error("Failed to save country details:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to save country details."
      );
    } finally {
      setIsSavingDetails(false);
    }
  };

  const [selectedCountry, setSelectedCountry] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [hasUnsavedDetails, setHasUnsavedDetails] = useState(false);
  useEffect(() => {
    if (!hasUnsavedDetails) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedDetails]);
  const [unsavedCountryCode, setUnsavedCountryCode] = useState<string | null>(null);
  const [newCity, setNewCity] = useState("");
  const [newAttraction, setNewAttraction] = useState({
    name: "",
    category: "Landmark",
    city: "",
    visitDate: "",
    rating: 5,
    notes: "",
  });

  const [selectedCountryCode, setSelectedCountryCode] =
    useState<string | null>(null);
  
  const handleCountryStatusChange = async (
    countryCode: string,
    status: CountryStatus
  ) => {
    if (isSavingStatus) {
      return;
    }

    setIsSavingStatus(true);

    try {
      await onCountryStatusChange(countryCode, status);
    } finally {
      setIsSavingStatus(false);
    }
  };
  
  const [hoveredCountry, setHoveredCountry] = useState<{
  name: string;
  x: number;
  y: number;
  status: string;
  flagUrl: string | undefined;
  silhouettePath: string;
} | null>(null);

  const handleCountryDetailsChange = (
    countryCode: string,
    details: CountryDetails
  ) => {
    onCountryDetailsChange(countryCode, details);

    setHasUnsavedDetails(true);
    setUnsavedCountryCode(countryCode);
  };
  return (
    <div className="world-map-container">
      <div className="world-map-heading">
        <div>
          <h2>Explore the world</h2>
          <p>Select a country to discover your travel journey.</p>
        </div>

        <div className="map-legend">
          <span><i className="visited-dot" /> Visited</span>
          <span><i className="planned-dot" /> Planned</span>
          <span><i className="unvisited-dot" /> Not visited</span>
        </div>
      </div>

      <div className="world-map">
        <ComposableMap
          projectionConfig={{
            scale: 145,
          }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryCode = String(geo.id);
                  const countryName = (geo.properties as { name?: string }).name ?? "Unknown country";

                  const countryStatus = countryStatuses[countryCode] ?? "not-visited";

                  const isVisited = countryStatus === "visited";
                  const isPlanned = countryStatus === "planned";        
                  const alpha3Code = countries.numericToAlpha3(countryCode);
                  const alpha2Code = alpha3Code
                    ? countries.alpha3ToAlpha2(alpha3Code)
                    : undefined;

                  const flagUrl = alpha2Code
                    ? `https://flagcdn.com/w40/${alpha2Code.toLowerCase()}.png`
                    : undefined;

                  const silhouettePath =
                    geoPath(
                      geoMercator().fitSize([76, 52], geo as never)
                    )(geo as never) ?? "";

                  return (
                    
                    <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (isSavingDetails || isSavingStatus) {
                        window.alert(
                          "Please wait until the current save operation finishes."
                        );
                        return;
                      }

                      if (
                        hasUnsavedDetails &&
                        unsavedCountryCode !== null &&
                        unsavedCountryCode !== countryCode
                      ) {
                        window.alert(
                          "You have unsaved changes in another country. " +
                          "Please return to that country and click Save Changes before switching."
                        );
                        return;
                      }

                      setSelectedCountry(countryName);
                      setSelectedCountryCode(countryCode);
                    }}
                    onMouseEnter={() => {}}
                    onMouseMove={(event) => {
                    setHoveredCountry({
                      name: countryName,
                      x: event.clientX,
                      y: event.clientY,
                      status: isVisited
                        ? "Visited"
                        : isPlanned
                        ? "Planned"
                        : "Not visited",
                      flagUrl,
                      silhouettePath,
                    });
                  }}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                        fill: isVisited
                        ? "#16865B"
                        : isPlanned
                        ? "#E7B65C"
                        : "#E6E9E7",
                        stroke: "#FFFFFF",
                        strokeWidth: 0.6,
                        outline: "none",
                        cursor: "pointer",
                    }}
                    />

                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
      
{hoveredCountry && (
        <div
          className="country-tooltip"
          style={{
            left: hoveredCountry.x + 15,
            top: hoveredCountry.y + 15,
          }}
        >
          <div className="tooltip-country-info">
            {hoveredCountry.flagUrl ? (
              <img
                className="tooltip-flag"
                src={hoveredCountry.flagUrl}
                alt={`${hoveredCountry.name} flag`}
              />
            ) : (
              <span className="tooltip-flag-placeholder">🌍</span>
            )}

            <div className="tooltip-country-text">
              <strong>{hoveredCountry.name}</strong>
              <span>{hoveredCountry.status}</span>
            </div>
          </div>

          <div className="tooltip-country-map">
            <svg viewBox="0 0 76 52" role="img"
              aria-label={`${hoveredCountry.name} country outline`}
            >
              <path
                d={hoveredCountry.silhouettePath}
                fill="#85BFA4"
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
            </svg>
          </div>
        </div>
      )}
          
      <div className="selected-country">
        {selectedCountry ? (
          <>Selected country: <strong>{selectedCountry}</strong></>
        ) : (
          "Click any country on the map to select it."
        )}
      </div>
      {selectedCountryCode && (
        <div className="country-status-panel">
          <div className="status-panel-heading">
            <div>
              <p className="status-panel-label">UPDATE YOUR JOURNEY</p>
              <h3>{selectedCountry}</h3>
            </div>

            <button
              className="status-close-button"
              onClick={() => {
              if (isSavingDetails || isSavingStatus) {
                window.alert(
                  "Please wait until the current save operation finishes."
                );
                return;
              }

              if (hasUnsavedDetails) {
                window.alert(
                  "You have unsaved country details. " +
                  "Please click Save Changes before closing this panel."
                );
                return;
              }

              setSelectedCountryCode(null);
            }}
              aria-label="Close country panel"
            >
              ×
            </button>
          </div>

          <p className="status-panel-description">
            How would you describe your travel status for this country?
          </p>
          {(countryStatuses[selectedCountryCode] ?? "not-visited") === "visited" && (
            <div className="country-detail-field">
              <label htmlFor="first-visit-date">
                First visit date
              </label>

              <input
                id="first-visit-date"
                type="date"
                disabled={isSavingDetails}
                value={
                  countryDetails[selectedCountryCode]?.firstVisitDate ?? ""
                }
                onChange={(event) =>
                  handleCountryDetailsChange(selectedCountryCode, {
                    firstVisitDate: event.target.value,
                  })
                }
              />
            </div>
          )}
          {(countryStatuses[selectedCountryCode] ?? "not-visited") === "visited" && (
            <div className="country-detail-field">
              <label htmlFor="country-notes">
                Your travel memories
              </label>

              <textarea
                id="country-notes"
                rows={4}
                disabled={isSavingDetails}
                placeholder="Write about your experiences, favourite places and memories..."
                value={countryDetails[selectedCountryCode]?.notes ?? ""}
                onChange={(event) =>
                  handleCountryDetailsChange(selectedCountryCode, {
                    notes: event.target.value,
                  })
                }
              />
            </div>
          )}
          {(countryStatuses[selectedCountryCode] ?? "not-visited") === "visited" && (
            <div className="country-detail-field">
              <label htmlFor="city-input">
                Cities explored
              </label>

              <div className="city-input-row">
                <input
                  id="city-input"
                  type="text"
                  disabled={isSavingDetails}
                  placeholder="Enter a city name..."
                  value={newCity}
                  onChange={(event) => setNewCity(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();

                      const city = newCity.trim();
                      const existingCities =
                        countryDetails[selectedCountryCode]?.cities ?? [];

                      if (
                        city &&
                        !existingCities.some(
                          (existing) =>
                            existing.toLowerCase() === city.toLowerCase()
                        )
                      ) {
                        handleCountryDetailsChange(selectedCountryCode, {
                          cities: [...existingCities, city],
                        });
                        setNewCity("");
                      }
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={isSavingDetails}
                  onClick={() => {
                    const city = newCity.trim();
                    const existingCities =
                      countryDetails[selectedCountryCode]?.cities ?? [];

                    if (
                      city &&
                      !existingCities.some(
                        (existing) =>
                          existing.toLowerCase() === city.toLowerCase()
                      )
                    ) {
                      handleCountryDetailsChange(selectedCountryCode, {
                        cities: [...existingCities, city],
                      });
                      setNewCity("");
                    }
                  }}
                >
                  Add
                </button>
              </div>

              <div className="city-list">
                {(countryDetails[selectedCountryCode]?.cities ?? []).map(
                  (city, index) => (
                    <div className="city-item" key={`${city}-${index}`}>
                      <span>📍 {city}</span>

                      <button
                        type="button"
                        disabled={isSavingDetails}
                        onClick={() => {
                          const updatedCities =
                            (countryDetails[selectedCountryCode]?.cities ?? [])
                              .filter((_, cityIndex) => cityIndex !== index);

                          handleCountryDetailsChange(selectedCountryCode, {
                            cities: updatedCities,
                          });
                        }}
                        aria-label={`Remove ${city}`}
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
              <div className="country-detail-field attraction-section">
                <h3>Attractions & Experiences</h3>
                <p className="attraction-description">
                  Record the landmarks, heritage sites and experiences you explored.
                </p>

                <label htmlFor="attraction-name">Attraction name</label>
                <input
                  id="attraction-name"
                  type="text"
                  disabled={isSavingDetails}
                  placeholder="e.g. Taj Mahal"
                  value={newAttraction.name}
                  onChange={(event) =>
                    setNewAttraction({
                      ...newAttraction,
                      name: event.target.value,
                    })
                  }
                />

                <label htmlFor="attraction-category">Category</label>
                <select
                  id="attraction-category"
                  disabled={isSavingDetails}
                  value={newAttraction.category}
                  onChange={(event) =>
                    setNewAttraction({
                      ...newAttraction,
                      category: event.target.value,
                    })
                  }
                >
                  <option value="UNESCO Heritage">UNESCO Heritage</option>
                  <option value="Natural Attraction">Natural Attraction</option>
                  <option value="Landmark">Landmark</option>
                  <option value="Museum">Museum</option>
                  <option value="Food & Culture">Food & Culture</option>
                  <option value="Festival">Festival</option>
                  <option value="Other">Other</option>
                </select>

                <label htmlFor="attraction-city">City</label>
                <input
                  id="attraction-city"
                  type="text"
                  disabled={isSavingDetails}
                  placeholder="e.g. Agra"
                  value={newAttraction.city}
                  onChange={(event) =>
                    setNewAttraction({
                      ...newAttraction,
                      city: event.target.value,
                    })
                  }
                />

                <label htmlFor="attraction-date">Visit date</label>
                <input
                  id="attraction-date"
                  type="date"
                  disabled={isSavingDetails}
                  value={newAttraction.visitDate}
                  onChange={(event) =>
                    setNewAttraction({
                      ...newAttraction,
                      visitDate: event.target.value,
                    })
                  }
                />

                <label htmlFor="attraction-rating">Your rating</label>
                <select
                  id="attraction-rating"
                  disabled={isSavingDetails}
                  value={newAttraction.rating}
                  onChange={(event) =>
                    setNewAttraction({
                      ...newAttraction,
                      rating: Number(event.target.value),
                    })
                  }
                >
                  <option value={5}>★★★★★ - Excellent</option>
                  <option value={4}>★★★★☆ - Very good</option>
                  <option value={3}>★★★☆☆ - Good</option>
                  <option value={2}>★★☆☆☆ - Fair</option>
                  <option value={1}>★☆☆☆☆ - Poor</option>
                </select>

                <label htmlFor="attraction-notes">Your experience</label>
                <textarea
                  id="attraction-notes"
                  rows={3}
                  disabled={isSavingDetails}
                  placeholder="What did you enjoy about this place?"
                  value={newAttraction.notes}
                  onChange={(event) =>
                    setNewAttraction({
                      ...newAttraction,
                      notes: event.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  className="add-attraction-button"
                  disabled={isSavingDetails || !newAttraction.name.trim()}
                  onClick={() => {
                    if (!selectedCountryCode || !newAttraction.name.trim()) {
                      return;
                    }

                    const attraction: Attraction = {
                      id: Date.now().toString(),
                      ...newAttraction,
                    };

                    const existingAttractions =
                      countryDetails[selectedCountryCode]?.attractions ?? [];

                    handleCountryDetailsChange(selectedCountryCode, {
                      attractions: [...existingAttractions, attraction],
                    });

                    setNewAttraction({
                      name: "",
                      category: "Landmark",
                      city: "",
                      visitDate: "",
                      rating: 5,
                      notes: "",
                    });
                  }}
                >
                  + Add Attraction
                </button>
              </div>
              <div className="saved-attractions">
                <h3>Saved Attractions</h3>

                {(countryDetails[selectedCountryCode]?.attractions ?? []).length === 0 ? (
                  <p className="empty-attractions">
                    No attractions added yet. Start recording your experiences!
                  </p>
                ) : (
                  <div className="attraction-list">
                    {(countryDetails[selectedCountryCode]?.attractions ?? []).map(
                      (attraction) => (
                        <div className="attraction-card" key={attraction.id}>
                          <div className="attraction-card-header">
                            <div>
                              <h4>{attraction.name}</h4>
                              <span className="attraction-category">
                                {attraction.category}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="remove-attraction-button"
                              disabled={isSavingDetails}
                              onClick={() => {
                                handleCountryDetailsChange(selectedCountryCode, {
                                  attractions: (
                                    countryDetails[selectedCountryCode]?.attractions ?? []
                                  ).filter((item) => item.id !== attraction.id),
                                });
                              }}
                              aria-label={`Remove ${attraction.name}`}
                            >
                              ×
                            </button>
                          </div>

                          {attraction.city && <p>📍 {attraction.city}</p>}
                          {attraction.visitDate && <p>📅 {attraction.visitDate}</p>}
                          <p className="attraction-rating">
                            {"★".repeat(attraction.rating)}
                            {"☆".repeat(5 - attraction.rating)}
                          </p>
                          {attraction.notes && <p>{attraction.notes}</p>}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
            
          )}
          {(countryStatuses[selectedCountryCode] ?? "not-visited") === "visited" && (
            <div className="country-detail-save">
              <button
                type="button"
                className="add-attraction-button"
                disabled={
                  isSavingDetails ||
                  isSavingStatus ||
                  !onSaveCountryDetails ||
                  !hasUnsavedDetails ||
                  unsavedCountryCode !== selectedCountryCode
                }
                onClick={() => void handleSaveCountryDetails()}
              >
                {isSavingDetails
                  ? "Saving..."
                  : hasUnsavedDetails &&
                    unsavedCountryCode === selectedCountryCode
                  ? "Save Changes"
                  : "✓ Saved"}
              </button>
            </div>
          )}
          <div className="status-options">
            <button
              className={
                (countryStatuses[selectedCountryCode] ?? "not-visited") === "visited"
                  ? "status-option selected visited-option"
                  : "status-option"
              }
              disabled={isSavingStatus || isSavingDetails || hasUnsavedDetails}
              onClick={() =>
                void handleCountryStatusChange(selectedCountryCode, "visited")
              }
            >
              <span>✓</span>
              Visited
            </button>

            <button
              className={
                (countryStatuses[selectedCountryCode] ?? "not-visited") === "planned"
                  ? "status-option selected planned-option"
                  : "status-option"
              }
              disabled={isSavingStatus || isSavingDetails || hasUnsavedDetails}
              onClick={() =>
                void handleCountryStatusChange(selectedCountryCode, "planned")
              }
            >
              <span>◷</span>
              Planned
            </button>

            <button
              className={
                (countryStatuses[selectedCountryCode] ?? "not-visited") === "not-visited"
                  ? "status-option selected unvisited-option"
                  : "status-option"
              }
              disabled={isSavingStatus || isSavingDetails || hasUnsavedDetails}
              onClick={() =>
                void handleCountryStatusChange(selectedCountryCode, "not-visited")
              }
            >
              <span>○</span>
              Not visited
            </button>
          </div>
          {isSavingStatus && (
            <p role="status" aria-live="polite">
              Saving...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
