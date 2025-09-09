import Onda from "../assets/Rectanglelp.svg";
import carmovil from "../assets/carMovil.png";
import textoMW from "../assets/textoMWb.png";

// Importar iconos para las tiendas de aplicaciones
import appStoreIcon from "../assets/AppStore.svg";
import playStoreIcon from "../assets/GooglePlay.svg";

const MovingWiseLanding = () => {
  // Reemplaza estos enlaces con los de tus aplicaciones
  const appStoreLink =
    "https://apps.apple.com/co/app/movingwise/id6745722010?l=en-GB";
  const playStoreLink =
    "https://play.google.com/store/apps/details?id=com.movewise.movewise&pcampaignid=web_share";

  return (
    <div className="min-h-screen relative overflow-hidden mb-7">
      {/* Onda decorativa */}
      <img
        src={Onda}
        alt="Decorative wave"
        className="absolute inset-0 w-full h-full object-cover mb-4"
        style={{ zIndex: 5 }}
      />

      {/* Overlay */}
      <div className="absolute inset-0"></div>

      <div className="relative z-10 w-full h-full">
        <div className="flex flex-col md:flex-row items-center justify-center h-screen px-6 md:px-12">
          {/* Left Content */}
          <div className="w-full md:w-1/2 flex justify-center mb-10 md:mb-0">
            <div className="space-y-8 max-w-lg text-center md:text-left">
              {/* Logo */}
              <div className="flex justify-center md:justify-start">
                <img
                  src={textoMW}
                  alt="MovingWise Logo"
                  className="h-20 md:h-28 object-contain"
                />
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                  Smart logistic <span>management</span> for your{" "}
                  <span>moving company</span>
                </h2>

                <p className="text-lg sm:text-xl text-white max-w-md mx-auto md:mx-0 drop-shadow">
                  With MovingWise, organize your trucks, personnel, and
                  transfers in one place. In real time, without confusion.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  Get Started Now
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Imagen del móvil con botones debajo */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center">
            <img
              src={carmovil}
              alt="MovingWise Mobile App"
              className="w-3/4 sm:w-2/3 md:w-4/5 h-auto object-contain mb-6"
            />

            {/* Download Section - Solo imágenes en fila debajo del móvil */}

            <div className="flex justify-center gap-5">
              {/* App Store */}
              <a
                href={appStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110 duration-300"
              >
                <img
                  src={appStoreIcon}
                  alt="Descargar en App Store"
                  className="h-16 w-auto"
                />
              </a>

              {/* Google Play */}
              <a
                href={playStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110 duration-300"
              >
                <img
                  src={playStoreIcon}
                  alt="Disponible en Google Play"
                  className="h-16 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovingWiseLanding;
