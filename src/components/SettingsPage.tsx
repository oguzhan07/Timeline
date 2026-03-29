import { useSettingsStore } from '../store/settingsStore';

export default function SettingsPage() {
  const {
    colorScheme,
    toggleColorScheme,
    defaultNotifyBefore,
    setDefaultNotifyBefore,
    showCompletedTasks,
    toggleShowCompleted,
  } = useSettingsStore();

  return (
    <div className="settings-page">
      <div className="settings-section">
        <div className="settings-title">Gorunum</div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Karanlik Tema</div>
            <div className="setting-desc">Karanlik ve aydinlik tema arasinda gecis yap</div>
          </div>
          <div
            className={`toggle ${colorScheme === 'dark' ? 'on' : ''}`}
            onClick={toggleColorScheme}
          />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Tamamlanan Gorevleri Goster</div>
            <div className="setting-desc">Tamamlanan gorevleri takvimde goster</div>
          </div>
          <div
            className={`toggle ${showCompletedTasks ? 'on' : ''}`}
            onClick={toggleShowCompleted}
          />
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Bildirimler</div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Varsayilan Hatirlatma Suresi</div>
            <div className="setting-desc">Gorevden once kac dakika hatirlatilsin</div>
          </div>
          <select
            className="form-input form-select"
            style={{ width: 'auto' }}
            value={defaultNotifyBefore}
            onChange={e => setDefaultNotifyBefore(Number(e.target.value))}
          >
            <option value={5}>5 dk</option>
            <option value={10}>10 dk</option>
            <option value={15}>15 dk</option>
            <option value={30}>30 dk</option>
            <option value={60}>1 saat</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Hakkinda</div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Timeline App</div>
            <div className="setting-desc">v1.0.0 — Vite + React + Firebase</div>
          </div>
        </div>
      </div>
    </div>
  );
}
