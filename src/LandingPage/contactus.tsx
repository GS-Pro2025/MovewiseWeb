import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Fondo from "../assets/fondo3lp.png";

const ContactForm: React.FC = () => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telephone: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    alert(t('contact.successMessage'));
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      telephone: '',
      message: ''
    });
  };

  const svgStyle: React.CSSProperties = {
    shapeRendering: 'geometricPrecision',
    textRendering: 'geometricPrecision',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  };

  const StarSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={svgStyle} viewBox="0 0 784.11 815.53">
      <g id="Layer_x0020_1">
        <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"/>
      </g>
    </svg>
  );

  return (
    <div
      className="min-h-screen py-6 flex flex-col justify-center sm:py-12 bg-[#092962] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${Fondo})` }}
    >
      <div className="container mx-auto px-4">
        {/* Title and subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F09F52] to-[#F09F52]/20 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl" />
          <div className="text-white relative px-4 py-10 bg-[#EEF4FF]/70 shadow-lg sm:rounded-3xl sm:p-20">
            <form onSubmit={handleSubmit}>
              <input
                className="shadow mb-4 appearance-none border rounded w-full py-2 px-3 text-[#092962] leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder={t('contact.namePlaceholder')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                className="shadow mb-4 appearance-none border rounded w-full py-2 px-3 text-[#092962] leading-tight focus:outline-none focus:shadow-outline"
                type="email"
                placeholder={t('contact.emailPlaceholder')}
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                className="shadow mb-4 appearance-none border rounded w-full py-2 px-3 text-[#092962] leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder={t('contact.phonePlaceholder')}
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
              />

              <textarea
                className="shadow mb-4 appearance-none border rounded w-full py-2 px-3 text-[#092962] leading-tight focus:outline-none focus:shadow-outline"
                placeholder={t('contact.messagePlaceholder')}
                name="message"
                value={formData.message}
                onChange={handleChange}
                style={{ height: '121px' }}
                required
              />

              <div className="flex justify-between items-center mt-6">
                {/* Send button with star effect */}
                <button
                  type="submit"
                  className="relative px-12 py-3 bg-[#4c83fa] font-bold text-white border-3 border-[#4c83fa] rounded-lg transition-all duration-300 ease-in-out hover:bg-transparent hover:text-[#4c83fa]"
                >
                  {t('contact.sendButton')}
                  <div className="star-1"><StarSVG /></div>
                  <div className="star-2"><StarSVG /></div>
                  <div className="star-3"><StarSVG /></div>
                  <div className="star-4"><StarSVG /></div>
                  <div className="star-5"><StarSVG /></div>
                  <div className="star-6"><StarSVG /></div>
                </button>

                <button
                  className="shadow bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={handleReset}
                >
                  {t('contact.clearButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .star-1, .star-2, .star-3, .star-4, .star-5, .star-6 {
          position: absolute;
          width: 25px;
          height: auto;
          filter: drop-shadow(0 0 0 #4c83fa);
          z-index: -5;
          transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96);
          opacity: 0;
        }
        .star-1 { top: 20%; left: 20%; width: 25px; }
        .star-2 { top: 45%; left: 45%; width: 15px; transition: all 1s cubic-bezier(0, 0.4, 0, 1.01); }
        .star-3 { top: 40%; left: 40%; width: 5px; transition: all 1s cubic-bezier(0, 0.4, 0, 1.01); }
        .star-4 { top: 20%; left: 40%; width: 8px; transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01); }
        .star-5 { top: 25%; left: 45%; width: 15px; transition: all 0.6s cubic-bezier(0, 0.4, 0, 1.01); }
        .star-6 { top: 5%; left: 50%; width: 5px; transition: all 0.8s ease; }
        button:hover .star-1 { top: -80%; left: -30%; width: 25px; filter: drop-shadow(0 0 10px #4c83fa); z-index: 2; opacity: 1; }
        button:hover .star-2 { top: -20%; left: 10%; width: 15px; filter: drop-shadow(0 0 10px #4c83fa); z-index: 2; opacity: 1; }
        button:hover .star-3 { top: 55%; left: 25%; width: 5px; filter: drop-shadow(0 0 10px #4c83fa); z-index: 2; opacity: 1; }
        button:hover .star-4 { top: 30%; left: 80%; width: 8px; filter: drop-shadow(0 0 10px #4c83fa); z-index: 2; opacity: 1; }
        button:hover .star-5 { top: 25%; left: 115%; width: 15px; filter: drop-shadow(0 0 10px #4c83fa); z-index: 2; opacity: 1; }
        button:hover .star-6 { top: 5%; left: 60%; width: 5px; filter: drop-shadow(0 0 10px #4c83fa); z-index: 2; opacity: 1; }
        .fil0 { fill: #4c83fa; }
      `}</style>
    </div>
  );
};

export default ContactForm;