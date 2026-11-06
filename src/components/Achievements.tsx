import { useEffect, useRef, useState } from "react";

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

type AchievementProps = {
  countryStatuses: Record<string, string>;
  countryDetails: Record<string, CountryDetails>;
};

export default function Achievements({
  countryStatuses,
  countryDetails,
}: AchievementProps) {
  const visitedCountries = Object.values(countryStatuses).filter(
    (status) => status === "visited"
  ).length;

  const allAttractions = Object.values(countryDetails).flatMap(
    (details) => details.attractions ?? []
  );

  const naturalAttractions = allAttractions.filter(
    (item) => item.category === "Natural Attraction"
  ).length;

  const heritageAttractions = allAttractions.filter(
    (item) => item.category === "UNESCO Heritage"
  ).length;

  const achievements = [
    {
      id: "first-explorer",
      name: "First Explorer",
      description: "Visit your first country.",
      icon: "🌍",
      current: visitedCountries,
      target: 1,
    },
    {
      id: "globe-trotter",
      name: "Globe Trotter",
      description: "Visit 5 different countries.",
      icon: "✈️",
      current: visitedCountries,
      target: 5,
    },
    {
      id: "nature-lover",
      name: "Nature Lover",
      description: "Explore 10 natural attractions.",
      icon: "🏞️",
      current: naturalAttractions,
      target: 10,
    },
    {
      id: "heritage-hunter",
      name: "Heritage Hunter",
      description: "Explore 5 UNESCO heritage sites.",
      icon: "🏛️",
      current: heritageAttractions,
      target: 5,
    },
  ];

  const unlockedCount = achievements.filter(
    (item) => item.current >= item.target
  ).length;

  const [celebration, setCelebration] = useState<string | null>(null);

  const previousUnlocked = useRef<string[] | null>(null);

  useEffect(() => {
    const currentlyUnlocked = achievements
      .filter((item) => item.current >= item.target)
      .map((item) => item.id);

    // Record the initial state without showing a false celebration.
    if (previousUnlocked.current === null) {
      previousUnlocked.current = currentlyUnlocked;
      return;
    }

    const newlyUnlocked = currentlyUnlocked.filter(
      (id) => !previousUnlocked.current?.includes(id)
    );

    if (newlyUnlocked.length > 0) {
    const achievement = achievements.find(
      (item) => item.id === newlyUnlocked[0]
    );

    if (achievement) {
      setCelebration(achievement.name);
    }
  } else {
    // Hide the celebration if its achievement becomes locked again.
    setCelebration((currentCelebration) => {
      if (!currentCelebration) return null;

      const celebratedAchievement = achievements.find(
        (item) => item.name === currentCelebration
      );

      if (
        celebratedAchievement &&
        celebratedAchievement.current < celebratedAchievement.target
      ) {
        return null;
      }

      return currentCelebration;
    });
  }

  previousUnlocked.current = currentlyUnlocked;
  }, [visitedCountries, naturalAttractions, heritageAttractions]);

  return (
    <section className="achievements-section">
    {celebration && (
      <div
        className="achievement-celebration"
        role="status"
        aria-live="polite"
      >
        <div className="celebration-icon">🏆</div>

        <div className="celebration-content">
          <h3>🎉 Achievement Unlocked!</h3>
          <p>
            Congratulations! You've unlocked{" "}
            <strong>{celebration}</strong>!
          </p>
        </div>

        <button
          type="button"
          className="celebration-close"
          onClick={() => setCelebration(null)}
          aria-label="Close celebration"
        >
          ×
        </button>
      </div>
    )}
      <div className="achievements-heading">
        <div>
          <h2>Your Achievements</h2>
          <p>Every journey brings a new milestone.</p>
        </div>

        <span className="achievement-counter">
          {unlockedCount}/{achievements.length} Unlocked
        </span>
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement) => {
          const unlocked = achievement.current >= achievement.target;
          const progress = Math.min(
            (achievement.current / achievement.target) * 100,
            100
          );

          return (
            <article
              className={`achievement-card ${
                unlocked ? "unlocked" : "locked"
              }`}
              key={achievement.id}
            >
              <div className="achievement-icon">{achievement.icon}</div>

              <div className="achievement-information">
                <h3>{achievement.name}</h3>
                <p>{achievement.description}</p>

                <div className="achievement-progress">
                  <div className="achievement-progress-track">
                    <div
                      className="achievement-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <span>
                    {Math.min(achievement.current, achievement.target)}/
                    {achievement.target}
                  </span>
                </div>

                <span className="achievement-status">
                  {unlocked ? "✓ Unlocked" : "In progress"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
