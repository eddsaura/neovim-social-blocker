import { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  getConfig,
  updateConfig,
  getStats,
  setKeymaps,
  lockTwitter,
  getBlockedSites,
  addBlockedSite,
  removeBlockedSite,
} from "@/storage";
import {
  UserConfig,
  UserStats,
  DEFAULT_CONFIG,
  ChallengeCategory,
  UnlockDurationMode,
  UNLOCK_DURATION_PRESETS,
} from "@/storage/schema";
import { ConfigParser, toKeymapDefinitions } from "@/config-parser";
import "./options.css";

const ALL_CATEGORIES: { value: ChallengeCategory; label: string }[] = [
  { value: "basic-motion", label: "Basic Motion (h,j,k,l)" },
  { value: "word-motion", label: "Word Motion (w,b,e)" },
  { value: "line-motion", label: "Line Motion (0,$,gg,G)" },
  { value: "find-motion", label: "Find Motion (f,t,F,T)" },
  { value: "delete", label: "Delete (d,dd,x)" },
  { value: "change", label: "Change (c,cc)" },
  { value: "yank-paste", label: "Yank/Paste (y,p)" },
  { value: "visual-select", label: "Visual Mode (v,V)" },
];

function Options() {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [vimConfig, setVimConfig] = useState("");
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [newSite, setNewSite] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const loadedConfig = await getConfig();
    const loadedStats = await getStats();
    const loadedSites = await getBlockedSites();
    setConfig(loadedConfig);
    setStats(loadedStats);
    setBlockedSites(loadedSites);
  }

  async function handleAddSite() {
    if (!newSite.trim()) return;
    const sites = await addBlockedSite(newSite.trim());
    setBlockedSites(sites);
    setNewSite("");
    setMessage({
      type: "success",
      text: `Added ${newSite.trim()} to blocked sites`,
    });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleRemoveSite(site: string) {
    const sites = await removeBlockedSite(site);
    setBlockedSites(sites);
    setMessage({ type: "success", text: `Removed ${site} from blocked sites` });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSave() {
    try {
      await updateConfig(config);

      // Parse and save vim config if provided
      if (vimConfig.trim()) {
        const parser = new ConfigParser();
        const result = parser.parse(vimConfig);
        if (result.errors.length > 0) {
          setMessage({
            type: "error",
            text: "Vim config has errors: " + result.errors[0].message,
          });
          return;
        }
        await setKeymaps(toKeymapDefinitions(result));
      }

      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" });
    }
  }

  function handleCategoryToggle(category: ChallengeCategory) {
    setConfig((prev) => {
      const categories = prev.enabledCategories.includes(category)
        ? prev.enabledCategories.filter((c) => c !== category)
        : [...prev.enabledCategories, category];
      return { ...prev, enabledCategories: categories };
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setVimConfig(content);
    };
    reader.readAsText(file);
  }

  async function handleResetStats() {
    if (!confirm("Are you sure you want to reset all statistics?")) return;
    await chrome.storage.local.remove("stats");
    await loadData();
    setMessage({ type: "success", text: "Statistics reset!" });
  }

  async function handleLockNow() {
    await lockTwitter();
    setMessage({ type: "success", text: "Socials are now locked!" });
  }

  return (
    <div className="options-container">
      <div className="options-header">
        <h1>Block Socials - Vim Social Blocker</h1>
        <p>Configure your Neovim challenge experience</p>
      </div>

      {message && (
        <div className={"alert alert-" + message.type}>{message.text}</div>
      )}

      {/* Challenge Settings */}
      <div className="section">
        <h2 className="section-title">Challenge Settings</h2>

        <div className="form-group">
          <label className="form-label">Time Limit (seconds)</label>
          <input
            type="number"
            className="form-input"
            value={config.timeLimitSeconds}
            min={10}
            max={300}
            onChange={(e) =>
              setConfig({
                ...config,
                timeLimitSeconds: parseInt(e.target.value) || 60,
              })
            }
          />
          <p className="form-label-description">
            Time allowed to complete all challenges (10-300 seconds)
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Number of Challenges</label>
          <input
            type="number"
            className="form-input"
            value={config.challengeCount}
            min={1}
            max={10}
            onChange={(e) =>
              setConfig({
                ...config,
                challengeCount: parseInt(e.target.value) || 5,
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Difficulty</label>
          <select
            className="form-select"
            value={config.difficulty}
            onChange={(e) =>
              setConfig({
                ...config,
                difficulty: e.target.value as UserConfig["difficulty"],
              })
            }
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Unlock Duration</label>
          <select
            className="form-select"
            value={config.unlockDurationMode}
            onChange={(e) =>
              setConfig({
                ...config,
                unlockDurationMode: e.target.value as UnlockDurationMode,
              })
            }
          >
            {(Object.keys(UNLOCK_DURATION_PRESETS) as UnlockDurationMode[]).map(
              (mode) => (
                <option key={mode} value={mode}>
                  {UNLOCK_DURATION_PRESETS[mode].label} (
                  {UNLOCK_DURATION_PRESETS[mode].durationMs / 60000} min)
                </option>
              )
            )}
          </select>
          <p className="form-label-description">
            How long you can access blocked sites after completing a challenge
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Challenge Categories</label>
          <div className="checkbox-group">
            {ALL_CATEGORIES.map((cat) => (
              <label key={cat.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.enabledCategories.includes(cat.value)}
                  onChange={() => handleCategoryToggle(cat.value)}
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Blocked Sites */}
      <div className="section">
        <h2 className="section-title">Blocked Sites</h2>
        <p className="form-label-description" style={{ marginBottom: "16px" }}>
          Sites that require completing a Vim challenge to access.
        </p>

        <div className="form-group">
          <div className="site-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="reddit.com"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
            />
            <button className="btn btn-primary" onClick={handleAddSite}>
              Add Site
            </button>
          </div>
        </div>

        <div className="blocked-sites-list">
          {blockedSites.map((site) => (
            <div key={site} className="blocked-site-item">
              <span className="site-name">{site}</span>
              <button
                className="btn-remove"
                onClick={() => handleRemoveSite(site)}
                title="Remove site"
              >
                x
              </button>
            </div>
          ))}
          {blockedSites.length === 0 && (
            <p className="no-sites">No sites blocked. Add a site above.</p>
          )}
        </div>
      </div>

      {/* Vim Config */}
      <div className="section">
        <h2 className="section-title">Custom Keymaps</h2>
        <p className="form-label-description" style={{ marginBottom: "16px" }}>
          Paste your init.vim or upload a file. Only keymap commands (nmap,
          nnoremap, etc.) will be parsed.
        </p>

        <div className="form-group">
          <div className="file-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept=".vim,.txt"
              onChange={handleFileUpload}
            />
            <span
              className="file-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload init.vim
            </span>
          </div>
        </div>

        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder={
              "# Paste your Neovim config here\nnnoremap H ^\nnnoremap L $\ninoremap jj <Esc>"
            }
            value={vimConfig}
            onChange={(e) => setVimConfig(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="section">
          <h2 className="section-title">Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.successfulAttempts}</div>
              <div className="stat-label">Challenges Won</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.streakDays}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {stats.fastestCompletionMs
                  ? Math.round(stats.fastestCompletionMs / 1000) + "s"
                  : "-"}
              </div>
              <div className="stat-label">Best Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="section">
        <h2 className="section-title">Actions</h2>
        <div className="button-group">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          <button className="btn btn-secondary" onClick={handleLockNow}>
            Lock Now
          </button>
          <button className="btn btn-danger" onClick={handleResetStats}>
            Reset Stats
          </button>
        </div>
      </div>
    </div>
  );
}

// Mount the app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
