import React from 'react';
import { useTranslation } from 'react-i18next';
import BackgroundIm from '../../assets/imagenBg.webp';
import { WelcomePanelProps } from '../../types/authTypes';

const WelcomePanel: React.FC<WelcomePanelProps> = ({ isFlipped, onFlip }) => {
  const { t } = useTranslation();

  return (
    <div className="lg:flex w-3/5 hidden bg-gray-500 relative items-center">
      <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
        
        {/* Front Side - Login Welcome */}
        <div
          className={`absolute inset-0 w-full h-full bg-no-repeat bg-cover flex items-center transition-all duration-700 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            backgroundImage: `url(${BackgroundIm})`,
          }}
        >
          <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
          <div className="w-full px-24 z-10">
            <h1 className="text-5xl font-bold text-left tracking-wide text-white">
              {t('login.welcome.title')}
            </h1>
            <p className="text-3xl my-4 text-white">
              {t('login.welcome.subtitle')}
            </p>
            <div className="mt-8">
              <p className="text-xl mb-4 text-white">{t('login.welcome.newTo')}</p>
              <button 
                type="button"
                onClick={() => {
                  console.log('Create Account clicked, setting isFlipped to true');
                  onFlip(true);
                }}
                className="px-8 py-3 border-2 border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 cursor-pointer"
              >
                {t('login.welcome.createAccount')}
              </button>
            </div>
          </div>
        </div>

        {/* Back Side - Register Welcome */}
        <div
          className={`absolute inset-0 w-full h-full bg-no-repeat bg-cover flex items-center transition-all duration-700 ${
            isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            backgroundImage: `url(${BackgroundIm})`,
          }}
        >
          <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
          <div className="w-full px-24 z-10">
            <h1 className="text-5xl font-bold text-left tracking-wide text-white">
              {t('login.welcome.joinTitle')}
            </h1>
            <p className="text-3xl my-4 text-white">
              {t('login.welcome.joinSubtitle')}
            </p>
            <div className="mt-8">
              <p className="text-xl mb-4 text-white">{t('login.welcome.alreadyHave')}
              </p>
              <button 
                type="button"
                onClick={() => {
                  console.log('Sign In clicked, setting isFlipped to false');
                  onFlip(false);
                }}
                className="px-8 py-3 border-2 border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 cursor-pointer"
              >
                {t('login.welcome.signIn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePanel;