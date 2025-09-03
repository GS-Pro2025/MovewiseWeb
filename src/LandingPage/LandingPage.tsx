import Navbar from "./navbar";
import "../App.css";
import Homelp from "./homelp";
import Feature from "./Feature";
import { Element } from "react-scroll";
import Benefits from "./benefit";
import Plans from "./plans";
import ContactUs from "./contactus";
import Footer from "./footer";
function App() {
  return (
    <div className="w-full flex flex-col overflow-x-hidden">
      <Navbar />

      <Element name="home">
        <Homelp />
      </Element>

      <Element name="feature" className=" py-20">
        <Feature />
      </Element>

      <Element name="benefits" className=" pt-40">
        <Benefits />
      </Element>

      <Element name="plans">
        <Plans />
      </Element>
      <Element name="contactUs">
        <ContactUs />
      </Element>
      <Element name="footer">
        <Footer />
      </Element>
    </div>
  );
}

export default App;
