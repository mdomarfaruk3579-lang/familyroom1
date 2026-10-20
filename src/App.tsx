import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Gallery from './pages/Gallery';
import Statistics from './pages/Statistics';
import Calculator from './pages/Calculator';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackgroundAnimation from './components/BackgroundAnimation';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-[#F7F5F0] text-[#2A2421] font-sans relative flex flex-col transition-colors duration-300">
            <BackgroundAnimation />
            <Navbar />
            <main className="flex-grow p-3 sm:p-4 md:p-8 relative z-10">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/member/:id" element={<Profile />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/about" element={<AboutUs />} />
              </Routes>
            </main>
            <Footer />
            <OfflineIndicator />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
