import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import PhotosPage from "./pages/PhotosPage";
import AlbumsPage from "./pages/AlbumsPage";
import MapPage from "./pages/MapPage";
import FacesPage from "./pages/FacesPage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<PhotosPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/faces" element={<FacesPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
