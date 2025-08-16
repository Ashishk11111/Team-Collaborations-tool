import React from 'react';

export default function GoogleLoginPage() {
  const handleLogin = () => {
    window.open(' https://team-collaborations-backend.onrender.com/auth/google', '_self');
  };

  return (
    // <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100">
    //   <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md text-center">
        
    //     {/* Title */}
    //     <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
    //       Welcome Back
    //     </h1>
    //     <p className="text-gray-500 mb-8">
    //       Sign in to continue to your account
    //     </p>

    //     {/* Google Login Button */}
    //     <button
    //       onClick={handleLogin}
    //       className="flex items-center justify-center w-full gap-3 px-5 py-3 bg-white border border-gray-300 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
    //     >
    //       <img
    //         src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    //         alt="Google Logo"
    //         className="w-6 h-6"
    //       />
    //       <span className="text-gray-700 font-medium">Continue with Google</span>
    //     </button>

    //     {/* Footer */}
    //     <p className="mt-6 text-sm text-gray-400">
    //       By continuing, you agree to our{' '}
    //       <a href="#" className="text-blue-500 hover:underline">Terms</a> and{' '}
    //       <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>.
    //     </p>
    //   </div>
    // </div>
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-50 overflow-hidden">
      
      {/* Floating circles for creative background */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-pink-300 rounded-full opacity-30 animate-pulse"></div>

      {/* Login Card */}
      <div className="relative bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center transform transition-all hover:scale-105 duration-500">
        
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3">Welcome Back</h1>
        <p className="text-gray-500 mb-10">Sign in to continue to your account</p>

        {/* Google Login Button */}
        <button
          onClick={handleLogin}
          className="flex items-center justify-center w-full gap-3 px-6 py-3 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 text-white font-medium rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google Logo"
            className="w-6 h-6 bg-white rounded-full p-1"
          />
          Continue with Google
        </button>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-400">
          By continuing, you agree to our{' '}
          <a href="#" className="text-purple-500 hover:underline">Terms</a> and{' '}
          <a href="#" className="text-purple-500 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
