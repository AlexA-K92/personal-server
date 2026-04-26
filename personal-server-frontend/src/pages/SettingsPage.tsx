export function SettingsPage() {
  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure your personal server security and storage settings.</p>
        </div>
      </div>

      <div className="panel">
        <h2>Security settings</h2>

        <div className="settings-list">
          <div>
            <strong>Authentication</strong>
            <p>Mock local login. Backend auth is not connected yet.</p>
          </div>

          <div>
            <strong>Encryption</strong>
            <p>Not active yet. File encryption will be added in the backend.</p>
          </div>

          <div>
            <strong>Storage</strong>
            <p>Local browser state only. Backend file storage is coming next.</p>
          </div>
        </div>
      </div>
    </section>
  );
}