import MapView from "./components/MapView";
import "leaflet/dist/leaflet.css";
import "./app.css";

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>Sunset &amp; Scenic Roads — Starter ok</h1>
        <p>Explore beautiful drives and golden-hour viewpoints.</p>
      </header>
      <main>
        <MapView />
      </main>
    </div>
  );
}

export default App;
