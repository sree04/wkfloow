import React from 'react';
import { Workflow } from 'lucide-react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-3xl mx-auto">
        <div className="mb-8 flex justify-center">
          <Workflow className="w-20 h-20 text-indigo-600" />
        </div>
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Welcome to Workflow Manager
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Streamline your business processes with our intuitive workflow management system.
          Design, manage, and optimize your workflows with ease.
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold
                     hover:bg-indigo-700 transition-colors duration-200 shadow-lg
                     hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;