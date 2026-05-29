import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { format, isToday, isPast } from 'date-fns';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const TaskBoard = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'Medium',
    dueDate: ''
  });

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.emit('join-team-room', { teamId });

      socket.on('task-created', (newTask) => {
        setTasks(prev => [...prev, newTask]);
      });

      socket.on('task-updated', (updatedTask) => {
        setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      });

      socket.on('task-status-changed', (updatedTask) => {
        setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      });

      socket.on('task-deleted', (taskId) => {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      });

      return () => {
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-status-changed');
        socket.off('task-deleted');
        // socket.emit('leave-team-room', { teamId }); // Optional cleanup
      };
    }
  }, [teamId, socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, tasksRes] = await Promise.all([
        axios.get(`/teams/${teamId}`),
        axios.get(`/tasks/${teamId}`)
      ]);
      setTeam(teamRes.data?.data || teamRes.data);
      setTasks(tasksRes.data?.data || tasksRes.data || []);
    } catch (error) {
      toast.error('Failed to load task board');
    } finally {
      setLoading(false);
    }
  };

  const isLeader = team?.leader?._id === user?._id || team?.leader === user?._id;

  const openAddModal = () => {
    setModalMode('add');
    setTaskForm({ title: '', description: '', assignee: '', priority: 'Medium', dueDate: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setModalMode('edit');
    setSelectedTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignee: task.assignee?._id || task.assignee || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Title is required');

    try {
      setActionLoading(true);
      if (modalMode === 'add') {
        const res = await axios.post(`/tasks/${teamId}`, taskForm);
        // Socket should handle the update, but optimistic UI or fallback here
        toast.success('Task created');
      } else {
        await axios.patch(`/tasks/${selectedTaskId}`, taskForm);
        toast.success('Task updated');
      }
      setIsModalOpen(false);
      fetchData(); // Fallback if socket fails
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode} task`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t._id !== taskId)); // Optimistic UI
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic Update
    const prevTasks = [...tasks];
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await axios.patch(`/tasks/${taskId}/status`, { status: newStatus });
      // Socket handles broadcast
    } catch (error) {
      toast.error('Failed to update status');
      setTasks(prevTasks); // Rollback
    }
  };

  const getPriorityColor = (priority) => {
    if (priority?.toLowerCase() === 'high') return 'bg-danger/20 text-danger border-danger/30';
    if (priority?.toLowerCase() === 'low') return 'bg-success/20 text-success border-success/30';
    return 'bg-warning/20 text-warning border-warning/30';
  };

  const getDueDateColor = (dateString) => {
    if (!dateString) return 'text-text-muted';
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'text-danger font-medium';
    if (isToday(date)) return 'text-warning font-medium';
    return 'text-text-muted';
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!team) return null;

  const columns = [
    { id: 'todo', label: 'TODO', headerColor: 'bg-input text-text-primary border-border' },
    { id: 'in_progress', label: 'IN PROGRESS', headerColor: 'bg-primary/10 text-primary border-primary/20' },
    { id: 'done', label: 'DONE', headerColor: 'bg-success/10 text-success border-success/20' }
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <Link to={`/teams/${teamId}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-2">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Team
          </Link>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            Task Board <span className="text-xl font-normal text-text-muted">• {team.teamName || team.name}</span>
          </h1>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="flex-1 min-w-[320px] max-w-[450px] bg-card border border-border rounded-xl flex flex-col">
              <div className={`p-4 border-b border-b-border rounded-t-xl flex justify-between items-center ${col.headerColor}`}>
                <h3 className="font-bold tracking-wide">{col.label}</h3>
                <span className="bg-main/50 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-inner">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {colTasks.length > 0 ? (
                  colTasks.map(task => {
                    const isCreator = task.creator?._id === user?._id || task.creator === user?._id;
                    const canEdit = isLeader || isCreator;
                    const assigneeObj = team.members?.find(m => m._id === (task.assignee?._id || task.assignee)) || (team.leader?._id === (task.assignee?._id || task.assignee) ? team.leader : null);

                    return (
                      <div key={task._id} className="bg-input border border-border rounded-lg p-4 shadow-sm hover:border-primary/50 transition-colors group relative">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-text-primary pr-12 leading-tight">{task.title}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)} absolute right-4 top-4`}>
                            {task.priority || 'Med'}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-2">
                            {assigneeObj ? (
                              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-bold" title={assigneeObj.name}>
                                {assigneeObj.name.charAt(0)}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-main border border-border flex items-center justify-center text-[10px] font-bold text-text-muted" title="Unassigned">
                                ?
                              </div>
                            )}
                            {task.dueDate && (
                              <span className={`text-[11px] ${getDueDateColor(task.dueDate)}`}>
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task._id, e.target.value)}
                              className="text-xs bg-main border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-primary cursor-pointer appearance-none"
                            >
                              <option value="todo">TODO</option>
                              <option value="in_progress">IN PROGRESS</option>
                              <option value="done">DONE</option>
                            </select>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              {canEdit && (
                                <button onClick={() => openEditModal(task)} className="p-1 text-text-muted hover:text-primary transition-colors">
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                              )}
                              {isLeader && (
                                <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-text-muted hover:text-danger transition-colors">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center pb-8">
                    <EmptyState 
                      icon={<ClipboardDocumentListIcon className="w-8 h-8 text-border" />}
                      title=""
                      description="No tasks here"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Add New Task' : 'Edit Task'}>
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Title <span className="text-danger">*</span></label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={e => setTaskForm({...taskForm, title: e.target.value})}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. Design landing page"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
            <textarea
              value={taskForm.description}
              onChange={e => setTaskForm({...taskForm, description: e.target.value})}
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-primary transition-colors"
              placeholder="Task details..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Assign To</label>
              <select
                value={taskForm.assignee}
                onChange={e => setTaskForm({...taskForm, assignee: e.target.value})}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Unassigned</option>
                <option value={team.leader?._id}>{team.leader?.name} (Leader)</option>
                {team.members?.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Due Date</label>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-text-muted hover:bg-input font-medium text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {modalMode === 'add' ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default TaskBoard;
