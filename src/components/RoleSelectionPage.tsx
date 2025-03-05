import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const RoleSelectionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, roles } = location.state as { userId: number; roles: string[] } || { userId: undefined, roles: [] };

  // State for selected role
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Debugging log
  console.log('RoleSelectionPage state:', { userId, roles, locationState: location.state, fullLocation: location });

  useEffect(() => {
    if (!userId || !roles || roles.length === 0) {
      console.log('No user information available, redirecting to welcome');
      navigate('/welcome', { state: { error: 'No user information available. Please log in again.' } });
      return;
    }
  }, [userId, roles, navigate]);

  const handleRoleSelection = () => {
    if (!selectedRole) {
      return; // Prevent navigation if no role is selected
    }

    if (roles.includes('workflow-designer') && selectedRole === 'workflow-designer') {
      navigate('/wizard', { state: { userId, roles: [selectedRole] } });
    } else {
      navigate('/dashboard', { state: { userId, roles: [selectedRole] } });
    }
  };

  // If user has workflow-designer role, show options for workflow-designer and other roles
  if (roles.includes('workflow-designer')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-200 w-full max-w-md">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Select Your Role</h2>
          <p className="text-gray-600 mb-4">Choose a role to proceed:</p>
          
          {/* Option for workflow-designer */}
          <div className="mb-4">
            <label className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="workflow-designer"
                checked={selectedRole === 'workflow-designer'}
                onChange={() => setSelectedRole('workflow-designer')}
                className="h-4 w-4 text-purple-600 border-purple-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-purple-800 capitalize">Workflow Designer</span>
            </label>
          </div>

          {/* Other available roles (excluding workflow-designer) */}
          {roles
            .filter(role => role !== 'workflow-designer')
            .map((role, index) => (
              <div key={index} className="mb-4">
                <label className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="h-4 w-4 text-purple-600 border-purple-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-purple-800 capitalize">{role.replace(/-/g, ' ')}</span>
                </label>
              </div>
            ))}

          <button
            onClick={handleRoleSelection}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!selectedRole}
          >
            Proceed
          </button>
        </div>
      </div>
    );
  }

  // For non-workflow-designer users, show all available roles and redirect to dashboard
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100">
      <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Select Your Role</h2>
        <p className="text-gray-600 mb-4">Choose a role to proceed:</p>
        
        {roles.map((role, index) => (
          <div key={index} className="mb-4">
            <label className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer">
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="h-4 w-4 text-purple-600 border-purple-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-purple-800 capitalize">{role.replace(/-/g, ' ')}</span>
            </label>
          </div>
        ))}

        <button
          onClick={handleRoleSelection}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!selectedRole}
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionPage;