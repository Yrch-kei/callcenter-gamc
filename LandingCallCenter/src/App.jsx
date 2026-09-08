import { SmoothScroll } from './components/SmoothScroll';
import { InteractiveGrid } from './components/InteractiveGrid';
import { Navbar } from './sections/Navbar';
import { Hero } from './sections/Hero';
import { ImageCarousel } from './sections/ImageCarousel';
import { CitizenComplaintAI } from './components/CitizenComplaintAI';
import { TrackComplaint } from './sections/TrackComplaint';
import { Features } from './sections/Features';
import { Categories } from './sections/Categories';
import { CTA } from './sections/CTA';
import { Footer } from './sections/Footer';

function App() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#09090b] text-white">
        <InteractiveGrid />
        <Navbar />
        <main>
          <Hero />
          <ImageCarousel />
          <CitizenComplaintAI />
          <TrackComplaint />
          <Features />
          <Categories />
          <CTA />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}

export default App;
