import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const NICE_COORDS: [number, number] = [43.7, 7.26];

function MapView() {
  return (
    <MapContainer
      center={NICE_COORDS}
      zoom={11}
      style={{ height: "60vh", width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}

export default MapView;
