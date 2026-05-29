import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const CreateTeam = () => {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    hackathon: '',
    isOpen: true,
    openSlots: [
      { role: '', minScore: 0, requiredSkills: [], currentSkillInput: '' }
    ]
  });

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await axios.get('/hackathon');
        setHackathons(res.data?.data || res.data || []);
      } catch (error) {
        toast.error('Failed to load hackathons');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchHackathons();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...formData.openSlots];
    newSlots[index][field] = value;
    setFormData(prev => ({ ...prev, openSlots: newSlots }));
  };

  const handleSkillKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = formData.openSlots[index].currentSkillInput.trim();
      if (val && !formData.openSlots[index].requiredSkills.includes(val)) {
        const newSlots = [...formData.openSlots];
        newSlots[index].requiredSkills.push(val);
        newSlots[index].currentSkillInput = '';
        setFormData(prev => ({ ...prev, openSlots: newSlots }));
      }
    }
  };

  const removeSkill = (slotIndex, skillIndex) => {
    const newSlots = [...formData.openSlots];
    newSlots[slotIndex].requiredSkills.splice(skillIndex, 1);
    setFormData(prev => ({ ...prev, openSlots: newSlots }));
  };

  const addSlot = () => {
    if (formData.openSlots.length >= 5) {
      toast.error('Maximum 5 slots allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      openSlots: [...prev.openSlots, { role: '', minScore: 0, requiredSkills: [], currentSkillInput: '' }]
    }));
  };

  const removeSlot = (index) => {
    if (formData.openSlots.length <= 1) {
      toast.error('At least one slot is required');
      return;
    }
    const newSlots = formData.openSlots.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, openSlots: newSlots }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) return toast.error('Team name is required');
    if (!formData.hackathon) return toast.error('Please select a hackathon');
    if (formData.openSlots.length === 0) return toast.error('At least one open slot is required');
    
    // Validate slots
    const isValidSlots = formData.openSlots.every(slot => slot.role.trim() !== '');
    if (!isValidSlots) return toast.error('All slots must have a role name');

    // Clean data payload
    const payload = {
      name: formData.name,
      hackathon: formData.hackathon,
      isOpen: formData.isOpen,
      openSlots: formData.openSlots.map(slot => ({
        role: slot.role,
        minScore: Number(slot.minScore) || 0,
        requiredSkills: slot.requiredSkills
      }))
    };

    try {
      setLoading(true);
      const res = await axios.post('/teams/create', payload);
      toast.success('Team created successfully!');
      navigate(`/teams/${res.data?.data?._id || res.data?._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link to="/teams" className="p-2 rounded-lg hover:bg-input text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">Create a Team</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Team Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Team Name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. NeoHackers"
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Hackathon <span className="text-danger">*</span></label>
              <select
                name="hackathon"
                value={formData.hackathon}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                required
                disabled={initialLoading}
              >
                <option value="">Select a hackathon</option>
                {hackathons.map(h => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isOpen"
                name="isOpen"
                checked={formData.isOpen}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-primary focus:ring-offset-main"
              />
              <label htmlFor="isOpen" className="text-sm text-text-primary">Open for new applications</label>
            </div>
          </div>
        </div>

        {/* Open Slots */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Open Slots</h2>
            <button
              type="button"
              onClick={addSlot}
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" /> Add Slot
            </button>
          </div>

          <div className="space-y-4">
            {formData.openSlots.map((slot, index) => (
              <div key={index} className="bg-input/50 border border-border rounded-lg p-4 relative">
                {formData.openSlots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="absolute top-2 right-2 p-1 text-text-muted hover:text-danger rounded-md transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Role Name</label>
                    <input
                      type="text"
                      value={slot.role}
                      onChange={(e) => handleSlotChange(index, 'role', e.target.value)}
                      placeholder="e.g. Frontend Developer"
                      className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Min Score</label>
                    <input
                      type="number"
                      value={slot.minScore}
                      onChange={(e) => handleSlotChange(index, 'minScore', e.target.value)}
                      min="0"
                      className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Required Skills</label>
                  <div className="bg-card border border-border rounded-lg p-2 min-h-[42px] flex flex-wrap gap-2 items-center">
                    {slot.requiredSkills.map((skill, sIdx) => (
                      <span key={sIdx} className="bg-input border border-border px-2 py-1 rounded text-xs text-text-primary flex items-center gap-1">
                        {skill}
                        <button type="button" onClick={() => removeSkill(index, sIdx)} className="hover:text-danger">
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={slot.currentSkillInput}
                      onChange={(e) => handleSlotChange(index, 'currentSkillInput', e.target.value)}
                      onKeyDown={(e) => handleSkillKeyDown(e, index)}
                      placeholder="Type skill and press Enter"
                      className="flex-1 bg-transparent border-none text-sm text-text-primary focus:outline-none min-w-[120px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading || initialLoading}
            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeam;
