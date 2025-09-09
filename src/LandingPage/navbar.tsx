import React, { useState, useEffect } from "react";
import { Link } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import textoMW from "../assets/textoMWb.png";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#ffffff]/80 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">
          {/* Logo */}
          <Link to="homeLp" smooth={true} duration={500} offset={-80}>
            <img
              src={textoMW}
              alt="MOVING WISE"
              className="h-12 sm:h-16 w-auto py-2 transition-transform duration-300 hover:scale-110 cursor-pointer"
            />
          </Link>

          {/* Links desktop - Ahora a la izquierda después del logo */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="feature"
              smooth={true}
              duration={500}
              offset={-80}
              className={`cursor-pointer transition-all duration-300  hover:text-[#FFE67B] ${
                isScrolled
                  ? "text-[#0B2863]"
                  : "text-white"
              }`}
            >
              Features
            </Link>
            <Link
              to="benefits"
              smooth={true}
              duration={500}
              offset={-80}
              className={`cursor-pointer transition-all duration-300  hover:text-[#FFE67B] ${
                isScrolled
                  ? "text-[#0B2863]"
                  : "text-white"
              }`}
            >
              Benefits
            </Link>
            <Link
              to="plans"
              smooth={true}
              duration={500}
              offset={-80}
              className={`cursor-pointer transition-all duration-300  hover:text-[#FFE67B] ${
                isScrolled
                  ? "text-[#0B2863]"
                  : "text-white"
              }`}
            >
              Plans
            </Link>
            <Link
              to="contactUs"
              smooth={true}
              duration={500}
              offset={-80}
              className="cursor-pointer text-[#0B2863] bg-[#FFE67B] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC]"
            >
              Contact Us
            </Link>
          </div>

          {/* Login/Register button - Ahora a la derecha con ml-auto */}
          <div className="hidden md:flex ml-auto">
            <RouterLink 
              to="/login"
              className="bg-[#FFE67B] text-[#0B2863] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC] transition inline-block"
            >
              Login / Register
            </RouterLink>
          </div>

          {/* Botón menú móvil */}
          <div className="md:hidden ml-auto">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none"
            >
              <svg
                className="w-8 h-8 text-blue-950"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-md shadow-lg">
          <div className="flex flex-col items-center space-y-4 py-4">
            <Link
              to="feature"
              smooth={true}
              duration={500}
              offset={-80}
              className="cursor-pointer text-blue-950 hover:text-[#FFE67B]"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              to="benefits"
              smooth={true}
              duration={500}
              offset={-80}
              className="cursor-pointer text-blue-950 hover:text-[#FFE67B]"
              onClick={() => setIsOpen(false)}
            >
              Benefits
            </Link>
            <Link
              to="plans"
              smooth={true}
              duration={500}
              offset={-80}
              className="cursor-pointer text-blue-950 hover:text-[#FFE67B]"
              onClick={() => setIsOpen(false)}
            >
              Plans
            </Link>
            <Link
              to="contactUs"
              smooth={true}
              duration={500}
              offset={-80}
              className="cursor-pointer bg-[#FFE67B] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC]"
              onClick={() => setIsOpen(false)}
            >
              Contact Us
            </Link>

            {/* Login/Register en móvil */}
            <RouterLink
              to="/login"
              onClick={() => setIsOpen(false)}
              className="bg-blue-950 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-800 transition inline-block"
            >
              Login / Register
            </RouterLink>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;