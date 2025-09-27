import Navbar from "./navbar";
import "../App.css";
import Homelp from "./homelp";
import Feature from "./Feature";
import Benefits from "./benefit";
import Plans from "./plans";
import ContactUs from "./contactus";
import Footer from "./footer";
import bg from "../assets/fondo1lp.png";

function LandingPage() {
  return (
    <>
      <div 
        className="w-full flex flex-col overflow-x-hidden min-h-screen"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      > 
        <Navbar />

        <section id="home">
          <Homelp />
        </section>

        <section id="features" className="py-20">
          <Feature />
        </section>

        <section id="benefits">
          <Benefits />
        </section>

        <section id="plans">
          <Plans />
        </section>
        
        <section id="contact" className="py-20">
          <ContactUs />
        </section>
        
        <footer id="footer">
          <Footer />
        </footer>
      </div>
    </>
  );
}

export default LandingPage;