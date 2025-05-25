import React, { useState, FormEvent } from 'react';
import Logo from '../assets/logo.png';
import BackgroundIm from '../assets/imagenBg.webp';
import { login } from '../service/authService';


const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');


  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await login(email, password);
    setMessage(result.message);
    if (result.success) {
       window.location.href = '/home'
    }
  };

  return (
    <div className="min-h-screen flex items-stretch text-white relative text-base md:text-lg">
      {/* Left Side */}
      <div
        className="lg:flex w-3/5 hidden bg-gray-500 bg-no-repeat bg-cover relative items-center"
        style={{
          backgroundImage: `url(${BackgroundIm})`,
        }}
      >
        <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
        <div className="w-full px-24 z-10">
          <h1 className="text-5xl font-bold text-left tracking-wide">Welcome to Movingwise</h1>
          <p className="text-3xl my-4">
            Organize, plan and control every step of your move from one place.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="lg:w-2/5 w-full flex items-center justify-center text-center bg-gradient-to-br from-[#0458AB] to-[#051537] relative">
        <div
          className="absolute lg:hidden inset-0 bg-gray-500 bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${BackgroundIm})` }}
        >
          <div className="absolute bg-black opacity-60 inset-0"></div>
        </div>

        <div className="w-full py-6 px-4 sm:px-8 z-20">
          <div className="my-6 flex justify-center items-center gap-4">
            <img src={Logo} alt="Company Logo" className="h-16 object-contain" />
            <h1 className="text-5xl font-semibold">Movingwise</h1>
          </div>

          <p className="text-xl text-gray-100 mb-6">or use email to sign into your account</p>

          {message && <p className="text-lg text-red-400">{message}</p>}

          <form className="sm:w-2/3 w-full mx-auto" onSubmit={handleLogin}>
            <div className="pb-2 pt-4">
              <input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full p-4 text-xl rounded-md bg-black text-white"
                required
              />
            </div>

            <div className="pb-2 pt-4 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full p-4 text-xl rounded-md bg-black text-white pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg text-gray-400 hover:text-gray-200"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="text-right text-gray-400 hover:underline hover:text-gray-100 text-lg">
              <a href="#">Forgot your password?</a>
            </div>

            <div className="px-4 pb-2 pt-6">
              <button
                type="submit"
                className="uppercase block w-full p-4 text-lg font-semibold rounded-full bg-[#0458AB] hover:bg-[#60A3D9] focus:outline-none"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

