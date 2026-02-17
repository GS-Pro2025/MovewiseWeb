import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import textoMW from "../assets/textoMWb.png";
import textoMWScroll from "../assets/textoMW.png";
import { useTranslation } from "react-i18next";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Habilita scroll suave con CSS nativo
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(event.target.value);
  };

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
          <a href="#home" onClick={() => scrollToSection("home")}>
            <img
              src={isScrolled ? textoMWScroll : textoMW}
              alt="MOVING WISE"
              className="h-12 sm:h-16 w-auto py-2 transition-all duration-300 hover:scale-110 cursor-pointer"
            />
          </a>

          {/* Links desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              onClick={() => scrollToSection("features")}
              className={`cursor-pointer transition-all duration-300 hover:text-[#FFE67B] ${
                isScrolled ? "text-[#0B2863]" : "text-white"
              }`}
            >
              {t("nav.features")}
            </a>
            <a
              href="#benefits"
              onClick={() => scrollToSection("benefits")}
              className={`cursor-pointer transition-all duration-300 hover:text-[#FFE67B] ${
                isScrolled ? "text-[#0B2863]" : "text-white"
              }`}
            >
              {t("nav.benefits")}
            </a>
            <a
              href="#plans"
              onClick={() => scrollToSection("plans")}
              className={`cursor-pointer transition-all duration-300 hover:text-[#FFE67B] ${
                isScrolled ? "text-[#0B2863]" : "text-white"
              }`}
            >
              {t("nav.plans")}
            </a>
            <a
              href="#contact"
              onClick={() => scrollToSection("contact")}
              className="cursor-pointer text-[#0B2863] bg-[#FFE67B] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC]"
            >
              {t("nav.contact")}
            </a>
          </div>

          {/* Login/Register */}
          <div className="hidden md:flex ml-auto">
            <RouterLink
              to="/login"
              className="bg-[#FFE67B] text-[#0B2863] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC] transition inline-block"
            >
              {t("nav.loginRegister")}
            </RouterLink>
          </div>

          <div className="hidden md:flex items-center ml-4">
            <label className={`mr-2 text-sm ${isScrolled ? "text-[#0B2863]" : "text-white"}`}>
              {t("nav.language")}
            </label>
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="rounded-full px-3 py-1 text-sm bg-white/90 text-[#0B2863] border border-white/60 focus:outline-none"
              aria-label={t("nav.language")}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
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
            <a
              href="#features"
              onClick={() => scrollToSection("features")}
              className="cursor-pointer text-blue-950 hover:text-[#FFE67B]"
            >
              {t("nav.features")}
            </a>
            <a
              href="#benefits"
              onClick={() => scrollToSection("benefits")}
              className="cursor-pointer text-blue-950 hover:text-[#FFE67B]"
            >
              {t("nav.benefits")}
            </a>
            <a
              href="#plans"
              onClick={() => scrollToSection("plans")}
              className="cursor-pointer text-blue-950 hover:text-[#FFE67B]"
            >
              {t("nav.plans")}
            </a>
            <a
              href="#contact"
              onClick={() => scrollToSection("contact")}
              className="cursor-pointer bg-[#FFE67B] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC]"
            >
              {t("nav.contact")}
            </a>

            {/* Login/Register en móvil */}
            <RouterLink
              to="/login"
              onClick={() => setIsOpen(false)}
              className="bg-blue-950 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-800 transition inline-block"
            >
              {t("nav.loginRegister")}
            </RouterLink>

            <div className="flex items-center gap-2">
              <span className="text-blue-950 text-sm">{t("nav.language")}</span>
              <select
                value={i18n.language}
                onChange={handleLanguageChange}
                className="rounded-full px-3 py-1 text-sm bg-white text-blue-950 border border-blue-950/20 focus:outline-none"
                aria-label={t("nav.language")}
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
