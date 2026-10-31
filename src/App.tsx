
import { useState } from "react";
import { brand } from "./config/brand";
import "./App.css";

const stats = [
  { label: "Countries", value: "12", icon: "🌍" },
  { label: "Cities", value: "38", icon: "🏙️" },
  { label: "Places explored", value: "64", icon: "📍" },
];

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

  const navigation = [
    "Explore",
    "My Journey",
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

            <div className="map-placeholder">
              <div className="map-content">
                <span className="map-globe">🌐</span>
                <h3>Your world is waiting.</h3>
                <p>
                  Your visited destinations will appear here
                  as you collect your travel memories.
                </p>
                <button className="secondary-button">
                  Start exploring
                </button>
              </div>
            </div>

            <div className="map-legend">
              <span><i className="legend-dot visited" /> Visited</span>
              <span><i className="legend-dot planned" /> Want to explore</span>
            </div>
          </article>

          <article className="panel milestone-panel">
            <p className="eyebrow">KEEP EXPLORING</p>
            <h2>Your next milestone</h2>

            <div className="milestone-icon">🏆</div>
            <h3>Culture Collector</h3>
            <p className="milestone-description">
              Visit 5 cultural landmarks to unlock your next badge.
            </p>

            <div className="progress-heading">
              <span>Progress</span>
              <strong>3 / 5</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" />
            </div>

            <p className="progress-caption">
              Just 2 more landmarks to go!
            </p>
          </article>
        </section>

        <section className="achievements-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR TRAVEL MILESTONES</p>
              <h2>Recent achievements</h2>
            </div>
            <button className="text-button">See all →</button>
          </div>

          <div className="achievement-grid">
            {achievements.map((achievement) => (
              <article className="achievement-card" key={achievement.title}>
                <div className="achievement-icon">
                  {achievement.icon}
                </div>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                <span className="achievement-progress">
                  {achievement.progress}
                </span>
              </article>
            ))}
          </div>
        </section>

        <footer className="footer">
          <p>© {new Date().getFullYear()} {brand.name}. {brand.tagline}</p>
          <p>Made for explorers everywhere 🌍</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
