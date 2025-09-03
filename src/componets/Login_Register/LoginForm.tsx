import React, { useState, FormEvent } from 'react';
import { login } from '../../service/authService';
import { LoginFormProps } from '../../types/authTypes';

const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword }) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await login(email, password);
    setMessage(result.message);
    if (result.success) {
      window.location.href = '/home';
    }
  };

  const handleForgotPasswordClick = () => {
    onForgotPassword(email);
  };

  return (
    <>
      <p className="text-xl text-gray-100 mb-6">Sign into your account</p>
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
          <button
            type="button"
            onClick={handleForgotPasswordClick}
            className="hover:underline hover:text-gray-100"
          >
            Forgot your password?
          </button>
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
    </>
  );
};

export default LoginForm;