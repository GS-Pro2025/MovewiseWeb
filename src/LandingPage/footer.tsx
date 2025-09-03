import React from "react";
import textoMW from "../assets/textoMW.png";
const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F09F52] text-center py-8 px-4">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="bg-white px-4 py-2 rounded-lg shadow-md">
        <img
              src={textoMW}
              alt="MOVING WISE"
              className="h-34 sm:h-24 w-auto py-2"
            />
        </div>
      </div>

      {/* Descriptive text */}
      <p className="text-black max-w-5xl mx-auto mb-4 text-2xl">
        At Moving Wise, we believe that an organized operation is the foundation for growth. 
        We designed this tool with detail and commitment so that every move is managed without chaos, 
        with clarity and real results.
      </p>

      {/* Reserved rights */}
      <p className="text-gray-100 font-semibold textlg">
        All rights reserved Moving Wise © 2025
      </p>
    </footer>

  );
};

export default Footer;

