import  { useState } from 'react';
import {
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    Search,
    Filter,
    Plus,
    Download,
    Upload,
    Trash2,
    Eye,
    Heart
} from 'lucide-react';

const CVs = () => {
    // TODO: Load CVs from API
    const [cvs] = useState([
        { id: 1, position: 'Senior Frontend Developer', status: 'Published', createdDate: '2026-05-01', updatedDate: '2026-06-15', likes: 12 },
        { id: 2, position: 'Full Stack Developer', status: 'Draft', createdDate: '2026-04-20', updatedDate: '2026-04-20', likes: 0 },
        { id: 3, position: 'React Developer', status: 'Hidden', createdDate: '2026-03-10', updatedDate: '2026-03-10', likes: 3 },
        { id: 4, position: 'Node.js Developer', status: 'Published', createdDate: '2026-02-05', updatedDate: '2026-05-20', likes: 8 },
        { id: 5, position: 'UX Designer', status: 'Draft', createdDate: '2026-06-01', updatedDate: '2026-06-10', likes: 0 },
        { id: 6, position: 'DevOps Engineer', status: 'Published', createdDate: '2026-01-15', updatedDate: '2026-04-30', likes: 5 }
    ]);

    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [positionFilter, setPositionFilter] = useState('all');

    // TODO: Fetch CV statistics
    const stats = [
        { label: 'Draft CVs', value: cvs.filter(cv => cv.status === 'Draft').length, icon: Clock, color: 'text-slate-600', bgColor: 'bg-slate-50' },
        { label: 'Published CVs', value: cvs.filter(cv => cv.status === 'Published').length, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
        { label: 'Hidden CVs', value: cvs.filter(cv => cv.status === 'Hidden').length, icon: Eye, color: 'text-red-600', bgColor: 'bg-red-50' },
        { label: 'Total CVs', value: cvs.length, icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' }
    ];

    const statuses = ['all', 'Draft', 'Published', 'Hidden'];
    const positions = ['all', ...new Set(cvs.map(cv => cv.position))];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Published':
                return 'bg-emerald-50 text-emerald-700';
            case 'Draft':
                return 'bg-slate-50 text-slate-700';
            case 'Hidden':
                return 'bg-red-50 text-red-700';
            default:
                return 'bg-slate-50 text-slate-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Published':
                return CheckCircle;
            case 'Draft':
                return Clock;
            case 'Hidden':
                return Eye;
            default:
                return Clock;
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredCVs.map(cv => cv.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredCVs = cvs.filter(cv => {
        const matchesSearch = cv.position.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || cv.status === statusFilter;
        const matchesPosition = positionFilter === 'all' || cv.position === positionFilter;
        return matchesSearch && matchesStatus && matchesPosition;
    });

    return (
        <div className="bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900">My CVs</h1>
                    <p className="text-slate-600 mt-1">Manage and track all your generated CVs.</p>
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

                {/* Search & Filter Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search CVs by position..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>
                                            {status === 'all' ? 'All Statuses' : status}
                                        </option>
                                    ))}
                                </select>
                                <Filter className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={positionFilter}
                                    onChange={(e) => setPositionFilter(e.target.value)}
                                    className="rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                                >
                                    {positions.map(position => (
                                        <option key={position} value={position}>
                                            {position === 'all' ? 'All Positions' : position}
                                        </option>
                                    ))}
                                </select>
                                <Filter className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-slate-600">
                                Total CVs: <span className="font-medium text-slate-900">{cvs.length}</span>
                            </span>
                            <span className="text-sm text-slate-600">
                                Visible: <span className="font-medium text-slate-900">{filteredCVs.length}</span>
                            </span>
                            {selectedIds.length > 0 && (
                                <span className="text-sm text-slate-600">
                                    Selected: <span className="font-medium text-blue-600">{selectedIds.length}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                <Plus className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                <Download className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                <Upload className="h-5 w-5" />
                            </button>
                            {selectedIds.length > 0 && (
                                <button className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* CV Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-3 px-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredCVs.length && filteredCVs.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                        />
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Position</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Created Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Last Updated</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Likes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCVs.map((cv) => {
                                    const StatusIcon = getStatusIcon(cv.status);
                                    return (
                                        <tr key={cv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(cv.id)}
                                                    onChange={() => handleSelectOne(cv.id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-900 font-medium">{cv.position}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cv.status)}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {cv.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{cv.createdDate}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{cv.updatedDate}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                                    <Heart className="h-4 w-4 text-rose-500" />
                                                    <span>{cv.likes}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredCVs.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-sm text-slate-500">
                                            No CVs found. Try adjusting your search or filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVs;