import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import AircraftList from './pages/AircraftList'
import AircraftDetail from './pages/AircraftDetail'
import AirlineList from './pages/AirlineList'
import AirlineDetail from './pages/AirlineDetail'
import ManufacturerList from './pages/ManufacturerList'
import Alliances from './pages/Alliances'
import Codes from './pages/Codes'
import Compare from './pages/Compare'
import Favorites from './pages/Favorites'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/aircraft" element={<AircraftList />} />
          <Route path="/aircraft/:id" element={<AircraftDetail />} />
          <Route path="/airlines" element={<AirlineList />} />
          <Route path="/airlines/:id" element={<AirlineDetail />} />
          <Route path="/manufacturers" element={<ManufacturerList />} />
          <Route path="/alliances" element={<Alliances />} />
          <Route path="/codes" element={<Codes />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
