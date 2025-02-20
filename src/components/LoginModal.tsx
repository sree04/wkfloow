import React, { useState } from 'react';
import ApiService from '../services/api';
import { X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (userType: 'user' | 'role', role?: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [userType, setUserType] = useState<'user' | 'role'>('user');
  const [role, setRole] = useState('designer');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username || !password) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await ApiService.login({
        username,
        password,
        userType,
        role: userType === 'role' ? role : undefined
      });
      
      localStorage.setItem('authToken', response.token);
      onLogin(userType, userType === 'role' ? role : undefined);
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    }finally {
      setIsLoading(false);
    }
  };

  {error && (
    <div className="text-red-600 text-sm mt-2">
      {error}
    </div>
  )}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="user"
                    checked={userType === 'user'}
                    onChange={() => setUserType('user')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="ml-2">User</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="role"
                    checked={userType === 'role'}
                    onChange={() => setUserType('role')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="ml-2">Role</span>
                </label>
              </div>
              
              {userType === 'role' && (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="designer">Workflow Designer</option>
                  <option value="admin">System Administrator</option>
                  <option value="reviewer">Content Reviewer</option>
                  <option value="manager">Project Manager</option>
                  <option value="approver">Financial Approver</option>
                  <option value="auditor">System Auditor</option>
                  <option value="supervisor">Team Supervisor</option>
                  <option value="coordinator">Process Coordinator</option>
                </select>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold
                       hover:bg-indigo-700 transition-colors duration-200"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginModal