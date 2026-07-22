import {
    User,
    FileText,
    Briefcase,
    MessageSquare
} from 'lucide-react';
import useAuth from "../hooks/useAuth";

const Dashboard = () => {
    const { user } = useAuth();

    const stats = [
        {
            label: 'Profile Completion',
            value: '78%',
            icon: User,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'My CVs',
            value: '5',
            icon: FileText,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Applications',
            value: '12',
            icon: Briefcase,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            label: 'Discussions',
            value: '8',
            icon: MessageSquare,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        }
    ];

    const recentPositions = [
        { position: 'Senior Frontend Developer', department: 'Engineering', deadline: '2026-08-15', status: 'Active' },
        { position: 'Product Manager', department: 'Product', deadline: '2026-07-30', status: 'Active' },
        { position: 'UX Designer', department: 'Design', deadline: '2026-08-01', status: 'Reviewing' },
        { position: 'DevOps Engineer', department: 'Infrastructure', deadline: '2026-08-20', status: 'Active' }
    ];

    const activities = [
        {
            title: 'CV Generated',
            description: 'New CV created for Senior Frontend position',
            time: '2 hours ago',
            icon: FileText
        },
        {
            title: 'Profile Updated',
            description: 'Added new work experience and skills',
            time: '4 hours ago',
            icon: User
        },
        {
            title: 'Discussion Replied',
            description: 'Replied to feedback on UX position',
            time: '6 hours ago',
            icon: MessageSquare
        }
    ];

    return (
        <div className="bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Welcome Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Welcome Back, {user?.firstName} {user?.lastName}
                            </h1>
                            <p className="text-slate-600 mt-1">Manage your profile, CVs and positions from one place.</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <span>Email: {user?.email}</span>
                                <span className="text-slate-300">|</span>
                                <span>Role: {user?.role}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-sm text-slate-600">Profile Completion</span>
                                <span className="text-lg font-semibold text-blue-600">78%</span>
                            </div>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                                Complete Profile
                            </button>
                        </div>
                    </div>
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

                {/* Recent Positions Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Positions</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Position</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Department</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Deadline</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPositions.map((position, index) => (
                                    <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 text-sm text-slate-900">{position.position}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{position.department}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{position.deadline}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {position.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border-l-4 border-blue-500">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                    <activity.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-slate-900">{activity.title}</h3>
                                    <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
                                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;