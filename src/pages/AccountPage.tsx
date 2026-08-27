import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';

export default function AccountPage() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
      setAddress(profile.address);
    }
  }, [profile]);

  if (!session) {
    navigate('/auth');
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, address })
      .eq('id', session.user.id);
    if (error) {
      showToast('Failed to update profile', 'error');
    } else {
      await refreshProfile();
      showToast('Profile updated successfully');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-6">My Account</h1>

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-display font-bold text-2xl">
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl text-gray-900">{profile?.full_name || 'User'}</h2>
            <p className="text-sm text-gray-500">{session.user.email}</p>
            {profile?.role === 'admin' && (
              <span className="badge bg-accent-50 text-accent-700 mt-1">
                <Shield className="w-3 h-3" />
                Administrator
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={session.user.email || ''} disabled className="input pl-10 bg-gray-50 cursor-not-allowed" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 84429 80101" className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Delivery Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Flat number, building, Shapoorji Housing Complex..." className="input pl-10 resize-none" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <button onClick={() => { signOut(); navigate('/'); }} className="btn-secondary w-full text-red-600 hover:bg-red-50 border-red-100">
        Sign Out
      </button>
    </div>
  );
}
