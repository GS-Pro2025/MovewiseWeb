import React from 'react';
import BackgroundIm from '../../assets/imagenBg.webp';
import { WelcomePanelProps } from '../../types/authTypes';

const WelcomePanel: React.FC<WelcomePanelProps> = ({ isFlipped, onFlip }) => {
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
              Welcome to Movingwise
            </h1>
            <p className="text-3xl my-4 text-white">
              Organize, plan and control every step of your move from one place.
            </p>
            <div className="mt-8">
              <p className="text-xl mb-4 text-white">New to Movingwise?</p>
              <button 
                type="button"
                onClick={() => {
                  console.log('Create Account clicked, setting isFlipped to true');
                  onFlip(true);
                }}
                className="px-8 py-3 border-2 border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 cursor-pointer"
              >
                Create Account
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
              Join Movingwise
            </h1>
            <p className="text-3xl my-4 text-white">
              Start your journey with us and make moving simple and efficient.
            </p>
            <div className="mt-8">
              <p className="text-xl mb-4 text-white">Already have an account?</p>
              <button 
                type="button"
                onClick={() => {
                  console.log('Sign In clicked, setting isFlipped to false');
                  onFlip(false);
                }}
                className="px-8 py-3 border-2 border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePanel;