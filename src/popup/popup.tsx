import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { getUnlockState, getStats } from "@/storage";
import type { UnlockState, UserStats } from "@/storage";
import { DEFAULT_STATS } from "@/storage/schema";
import "./popup.css";

function Popup() {
  const [unlockState, setUnlockState] = useState<UnlockState | null>(null);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const unlock = await getUnlockState();
      const userStats = await getStats();
      setUnlockState(unlock);
      setStats(userStats);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!unlockState?.isUnlocked || !unlockState.expiresAt) return;

    const updateTimer = () => {
      const remaining = unlockState.expiresAt! - Date.now();
      if (remaining <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(hours + "h " + minutes + "m");
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [unlockState]);

  const handleStartChallenge = () => {
    chrome.runtime.sendMessage({ type: "OPEN_CHALLENGE" });
    window.close();
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleOpenBuilder = () => {
    const url = chrome.runtime.getURL("src/builder/page.html");
    chrome.tabs.create({ url });
    window.close();
  };

  if (!unlockState) {
    return (
      <div className="popup-container">
        <div style={{ textAlign: "center", padding: "40px 0" }}>Loading...</div>
      </div>
    );
  }

  const isUnlocked =
    unlockState.isUnlocked &&
    unlockState.expiresAt &&
    Date.now() < unlockState.expiresAt;

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="popup-logo">⌨️</div>
        <div className="popup-title">
          <h1>Block Socials to learn</h1>
          <p>Neovim Edition</p>
        </div>
      </div>

      <div className="status-card">
        <div className="status-header">
          <div
            className={"status-dot " + (isUnlocked ? "unlocked" : "locked")}
          />
          <span className="status-label">
            {isUnlocked ? "Socials Unlocked" : "Socials Locked"}
          </span>
        </div>
        <p className="status-message">
          {isUnlocked
            ? "You passed the challenge! Enjoy Socials."
            : "Complete a Neovim challenge to unlock Socials."}
        </p>
        {isUnlocked && timeRemaining && (
          <div className="time-remaining">{timeRemaining} remaining</div>
        )}
      </div>

      {!isUnlocked && (
        <button
          className="action-button primary"
          onClick={handleStartChallenge}
        >
          Start Challenge
        </button>
      )}

      <button className="action-button secondary" onClick={handleOpenOptions}>
        Settings
      </button>

      <button className="action-button secondary" onClick={handleOpenBuilder}>
        Challenge Builder
      </button>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.successfulAttempts}</div>
          <div className="stat-label">Challenges Won</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.streakDays}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {stats.fastestCompletionMs
              ? Math.round(stats.fastestCompletionMs / 1000) + "s"
              : "-"}
          </div>
          <div className="stat-label">Best Time</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.totalAttempts}</div>
          <div className="stat-label">Total Attempts</div>
        </div>
      </div>

      <div className="footer-links">
        <a href="#" onClick={handleOpenOptions}>
          Options
        </a>
        <a
          href="https://github.com/eddsaura/neovim-social-blocker"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}

// Mount the app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
