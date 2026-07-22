import  { useState } from 'react';
import {
    MessageSquare,
    User,
    Mail,
    Briefcase,
    Search,
    Filter,
    Clock,
    CheckCircle
} from 'lucide-react';

const Discussions = () => {
    // TODO: Load discussions from API
    const [discussions] = useState([
        {
            id: 1,
            position: 'Senior Frontend Developer',
            author: 'John Doe',
            replies: 8,
            status: 'Open',
            lastActivity: '2 hours ago',
            preview: 'Can you clarify the React experience requirements?'
        },
        {
            id: 2,
            position: 'Product Manager',
            author: 'Sarah Chen',
            replies: 5,
            status: 'Open',
            lastActivity: '5 hours ago',
            preview: 'What are the key priorities for the product roadmap?'
        },
        {
            id: 3,
            position: 'UX Designer',
            author: 'Michael Brown',
            replies: 12,
            status: 'Resolved',
            lastActivity: '1 day ago',
            preview: 'The design system guidelines are now finalized.'
        },
        {
            id: 4,
            position: 'DevOps Engineer',
            author: 'Emily Wilson',
            replies: 3,
            status: 'Open',
            lastActivity: '3 hours ago',
            preview: 'Which cloud provider are we using for deployment?'
        },
        {
            id: 5,
            position: 'Data Analyst',
            author: 'David Kim',
            replies: 7,
            status: 'Resolved',
            lastActivity: '2 days ago',
            preview: 'The data schema has been updated with new fields.'
        }
    ]);

    // TODO: Load recent messages from API
    // TODO: Implement realtime updates
    const [recentMessages] = useState([
        {
            id: 1,
            author: 'John Doe',
            timestamp: '2 hours ago',
            message: 'Can you clarify the React experience requirements for the Senior Frontend position?'
        },
        {
            id: 2,
            author: 'Emily Wilson',
            timestamp: '3 hours ago',
            message: 'Which cloud provider are we using for the DevOps deployment?'
        },
        {
            id: 3,
            author: 'Sarah Chen',
            timestamp: '5 hours ago',
            message: 'What are the key priorities for the product roadmap this quarter?'
        }
    ]);

    // TODO: Connect discussion details page
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    const filters = ['all', 'Open', 'Resolved'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-blue-50 text-blue-700';
            case 'Resolved':
                return 'bg-emerald-50 text-emerald-700';
            default:
                return 'bg-slate-50 text-slate-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Open':
                return Clock;
            case 'Resolved':
                return CheckCircle;
            default:
                return Clock;
        }
    };

    const stats = [
        { label: 'Total Discussions', value: discussions.length, icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { label: 'My Posts', value: discussions.filter(d => d.author === 'John Doe').length, icon: User, color: 'text-purple-600', bgColor: 'bg-purple-50' },
        { label: 'Unread Messages', value: discussions.filter(d => d.status === 'Open').length, icon: Mail, color: 'text-amber-600', bgColor: 'bg-amber-50' },
        { label: 'Active Positions', value: [...new Set(discussions.map(d => d.position))].length, icon: Briefcase, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
    ];

    const filteredDiscussions = discussions.filter(discussion => {
        const matchesSearch = discussion.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            discussion.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            discussion.preview.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || discussion.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900">Discussions</h1>
                    <p className="text-slate-600 mt-1">Participate in position-related discussions and collaboration.</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                            >
                                {filters.map(f => (
                                    <option key={f} value={f}>
                                        {f === 'all' ? 'All Discussions' : f}
                                    </option>
                                ))}
                            </select>
                            <Filter className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Discussion List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Position</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Author</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Last Activity</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Replies</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDiscussions.map((discussion) => {
                                    const StatusIcon = getStatusIcon(discussion.status);
                                    return (
                                        <tr key={discussion.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                                            <td className="py-3 px-4 text-sm text-slate-900 font-medium">{discussion.position}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{discussion.author}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{discussion.lastActivity}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{discussion.replies}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(discussion.status)}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {discussion.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredDiscussions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-sm text-slate-500">
                                            No discussions found. Try adjusting your search or filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Discussion Preview */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Messages</h2>
                    <div className="space-y-4">
                        {recentMessages.map((message) => (
                            <div key={message.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border-l-4 border-blue-500">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex-shrink-0">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-medium text-slate-900">{message.author}</h3>
                                        <span className="text-xs text-slate-400">{message.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-0.5 truncate">{message.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Discussions;