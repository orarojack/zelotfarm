import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FirstLoginBanner() {
  const { supabaseUser } = useAuth();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (supabaseUser?.id) {
      // Check if password has been changed
      const passwordChanged = localStorage.getItem(`password_changed_${supabaseUser.id}`) === 'true';
      // Check if user has dismissed the banner
      const bannerDismissed = localStorage.getItem(`banner_dismissed_${supabaseUser.id}`) === 'true';
      
      // Show banner if password hasn't been changed and banner hasn't been dismissed
      if (!passwordChanged && !bannerDismissed) {
        setShowBanner(true);
      }
    }
  }, [supabaseUser]);

  const handleDismiss = () => {
    if (supabaseUser?.id) {
      localStorage.setItem(`banner_dismissed_${supabaseUser.id}`, 'true');
      setShowBanner(false);
    }
  };

  const handleGoToProfile = () => {
    navigate('/admin/profile');
    handleDismiss();
  };

  if (!showBanner) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                First Login - Change Your Password
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  For security, please change your default password in Profile Settings.
                  This is required for your account security.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-4 flex-shrink-0 text-yellow-600 hover:text-yellow-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={handleGoToProfile}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Go to Profile Settings
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

