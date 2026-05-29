import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import BuilderPassportCard from '../../components/BuilderPassportCard';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, getMe } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Edit fields
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [github, setGithub] = useState('');
  const [leetcode, setLeetcode] = useState('');
  const [codeforces, setCodeforces] = useState('');
  const [isOpenToTeam, setIsOpenToTeam] = useState(true);
  const [availability, setAvailability] = useState('available');

  // Education Sub-fields
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('college');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setLocation(user.location || '');
      setSkills(user.skills?.join(', ') || '');
      setGithub(user.github || '');
      setLeetcode(user.leetcode || '');
      setCodeforces(user.codeforces || '');
      setIsOpenToTeam(user.isOpenToTeam ?? true);
      setAvailability(user.availability || 'available');

      // Education
      setInstitutionName(user.education?.institutionName || '');
      setInstitutionType(user.education?.institutionType || 'college');
      setDegree(user.education?.degree || '');
      setBranch(user.education?.branch || '');
      setYear(user.education?.year || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      bio,
      location,
      skills: skillsArray,
      github,
      leetcode,
      codeforces,
      isOpenToTeam,
      availability,
      education: {
        institutionName,
        institutionType,
        degree,
        branch,
        year
      }
    };

    try {
      await axios.patch('/users/update-profile', payload);
      toast.success('Profile updated successfully!');
      await getMe(); // Refresh global user state
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScanTrigger = async () => {
    setIsScanning(true);
    const scanToast = toast.loading("Scanning dev profiles & codes...");
    try {
      await axios.post('/score/scan');
      toast.success('Profile scanned and score indexes recalculated!', { id: scanToast });
      await getMe(); // Refresh global user state
    } catch (err) {
      toast.error('Profile scan failed', { id: scanToast });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans">
      
      {/* Cover Banner Card */}
      <div className="glass-card bg-[#141417]/85 border border-[#232329] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden rounded-2xl shadow-xl select-none">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 rounded-l-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-2xl shadow-lg shadow-violet-600/10">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white leading-tight">
              {user?.name}
            </h1>
            <p className="text-sm text-text-muted mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-violet-500/10 text-violet-400 border border-violet-500/25 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {user?.tier || 'Beginner'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span className="text-xs text-text-muted capitalize">{availability.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Scan & Edit Actions */}
        <div className="flex items-center gap-3 shrink-0 z-10 w-full sm:w-auto">
          <button
            onClick={handleScanTrigger}
            disabled={isScanning}
            className="flex-1 sm:flex-initial btn-outline px-4 py-2.5 text-xs rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm"
          >
            <span>🔄</span>
            {isScanning ? 'Scanning...' : 'Scan Profile & Codes'}
          </button>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex-1 sm:flex-initial btn-secondary px-4 py-2.5 text-xs rounded-xl font-bold"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Passport Card */}
        <div className="lg:col-span-1">
          <div className="glass-card overflow-hidden">
            <BuilderPassportCard user={user} />
          </div>
        </div>
        
        {/* Right Column: Editor Form or Workspace Summaries */}
        <div className="lg:col-span-2">
          {isEditing ? (
            /* PROFILE EDITOR FORM */
            <form onSubmit={handleProfileSubmit} className="glass-card bg-[#141417]/85 p-6 sm:p-8 border border-[#232329] rounded-2xl shadow-lg space-y-6">
              
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-violet-400 border-b border-[#232329] pb-2">
                Personal details & Links
              </h3>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell co-builders about your projects, stack preferences, and schedule..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-sm font-medium text-white transition-all resize-none"
                />
              </div>

              {/* Location & skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Location / City</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, India"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-sm font-medium text-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Core Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, Node.js, Python, TailwindCSS"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-sm font-medium text-white transition-all"
                  />
                </div>
              </div>

              {/* External accounts links */}
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-violet-400 border-b border-[#232329] pb-2 pt-2">
                Platform Syncs
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="GitHub username"
                    className="w-full px-3 py-2 rounded-lg border border-[#232329] bg-[#16161a] text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    LeetCode User
                  </label>
                  <input
                    type="text"
                    value={leetcode}
                    onChange={(e) => setLeetcode(e.target.value)}
                    placeholder="LeetCode username"
                    className="w-full px-3 py-2 rounded-lg border border-[#232329] bg-[#16161a] text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Codeforces User
                  </label>
                  <input
                    type="text"
                    value={codeforces}
                    onChange={(e) => setCodeforces(e.target.value)}
                    placeholder="Codeforces username"
                    className="w-full px-3 py-2 rounded-lg border border-[#232329] bg-[#16161a] text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              {/* Education section */}
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-violet-400 border-b border-[#232329] pb-2 pt-2">
                Education Background
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Institution / University</label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. LNCT, Bhopal"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-sm font-medium text-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Institution Type</label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-xs font-semibold text-text-muted"
                  >
                    <option value="school">High School</option>
                    <option value="college">Undergrad College</option>
                    <option value="university">Grad University</option>
                    <option value="other">Other School</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Degree</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. Bachelor of Technology"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-sm font-medium text-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Major Branch / Stream</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-sm font-medium text-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Academic Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-xs font-semibold text-text-muted"
                  >
                    <option value="">Select Year</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                    <option value="passout">Passout / Graduated</option>
                  </select>
                </div>
              </div>

              {/* Status and availability */}
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-violet-400 border-b border-[#232329] pb-2 pt-2">
                Availability Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Recruitment Status</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#232329] bg-[#16161a] focus:outline-none focus:border-violet-500 text-xs font-semibold text-text-muted"
                  >
                    <option value="available">Available to Match</option>
                    <option value="busy">Busy (Building)</option>
                    <option value="weekends">Active on Weekends</option>
                    <option value="not_available">Not Seeking Teams</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    checked={isOpenToTeam}
                    onChange={(e) => setIsOpenToTeam(e.target.checked)}
                    id="isOpenToTeam"
                    className="w-4.5 h-4.5 rounded text-violet-600 border-[#232329] bg-[#16161a] focus:ring-violet-500"
                  />
                  <label htmlFor="isOpenToTeam" className="text-xs font-semibold text-text-muted cursor-pointer select-none">
                    List Profile on Teammate Discover
                  </label>
                </div>
              </div>

              {/* Save actions */}
              <div className="flex justify-end gap-3 border-t border-[#232329] pt-5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary px-5 py-2.5 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary px-5 py-2.5 text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-violet-600/10"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>Save Changes</>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* VIEW PROFILE WORKSPACE SUMMARY */
            <div className="space-y-6">
              
              {/* Bio summary */}
              <div className="glass-card bg-[#141417]/85 p-6 border border-[#232329] rounded-2xl shadow-sm space-y-3">
                <h3 className="font-bold text-white text-xs uppercase tracking-wide border-b border-[#232329] pb-2">
                  Developer Bio
                </h3>
                <p className="text-sm text-text-muted font-medium leading-relaxed">
                  {user?.bio || "This builder hasn't written a biography description yet. Click 'Edit Profile' to detail your experience."}
                </p>
              </div>

              {/* Core Competencies tag grid */}
              <div className="glass-card bg-[#141417]/85 p-6 border border-[#232329] rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wide border-b border-[#232329] pb-2">
                  Core Stack / Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user?.skills && user.skills.length > 0 ? (
                    user.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-[#18181c] text-violet-400 border border-[#232329] text-xs font-semibold px-3 py-1 rounded-xl"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted italic">No skills cataloged yet</span>
                  )}
                </div>
              </div>

              {/* Education details */}
              <div className="glass-card bg-[#141417]/85 p-6 border border-[#232329] rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wide border-b border-[#232329] pb-2">
                  Education Background
                </h3>
                {user?.education?.institutionName ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-white">{user.education.institutionName}</p>
                    <p className="text-xs text-text-muted font-medium capitalize">
                      {user.education.degree} in {user.education.branch} {user.education.year && `(${user.education.year} Year)`}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted font-medium italic">No education metrics registered.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
