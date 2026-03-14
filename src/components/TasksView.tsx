import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';

const initialTasks: Task[] = [
  { id: '1', title: 'Update design system documentation', status: 'in-progress', priority: 'high', dueDate: '2024-03-25', category: 'Design' },
  { id: '2', title: 'Implement OAuth callback handler', status: 'todo', priority: 'medium', dueDate: '2024-03-26', category: 'Backend' },
  { id: '3', title: 'Fix mobile navigation bug', status: 'completed', priority: 'high', dueDate: '2024-03-22', category: 'Frontend' },
  { id: '4', title: 'Prepare Q3 marketing assets', status: 'todo', priority: 'low', dueDate: '2024-04-01', category: 'Marketing' },
  { id: '5', title: 'Database migration for user profiles', status: 'in-progress', priority: 'high', dueDate: '2024-03-24', category: 'DevOps' },
];

const TasksView: React.FC = () => {
  const [tasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your team's progress.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20">
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {(['all', 'todo', 'in-progress', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 outline-none"
              />
            </div>
            <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Task Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task) => (
                  <motion.tr
                    key={task.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-rose-500' : 
                          task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
                        }`} />
                        <span className="text-sm font-medium text-slate-900">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        task.status === 'in-progress' ? 'bg-brand-50 text-brand-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status === 'completed' ? <CheckCircle2 size={12} /> : 
                         task.status === 'in-progress' ? <Clock size={12} /> : 
                         <AlertCircle size={12} />}
                        {task.status.replace('-', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 capitalize">{task.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} />
                        {task.dueDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Tag size={14} className="text-slate-400" />
                        {task.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredTasks.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-900 font-bold">No tasks found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksView;
