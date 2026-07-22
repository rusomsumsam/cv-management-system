import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Filter,
    Plus,
    Download,
    Upload,
    Trash2,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';

const Positions = () => {
    const navigate = useNavigate();

    const [positions, setPositions] = useState([
        {
            id: 1,
            title: 'Senior Frontend Developer',
            department: 'Engineering',
            deadline: '2026-08-15',
            status: 'Active'
        },
        {
            id: 2,
            title: 'Product Manager',
            department: 'Product',
            deadline: '2026-07-30',
            status: 'Active'
        },
        {
            id: 3,
            title: 'UX Designer',
            department: 'Design',
            deadline: '2026-08-01',
            status: 'Reviewing'
        },
        {
            id: 4,
            title: 'DevOps Engineer',
            department: 'Infrastructure',
            deadline: '2026-08-20',
            status: 'Active'
        },
        {
            id: 5,
            title: 'Data Analyst',
            department: 'Data Science',
            deadline: '2026-09-01',
            status: 'Draft'
        },
        {
            id: 6,
            title: 'Backend Engineer',
            department: 'Engineering',
            deadline: '2026-08-10',
            status: 'Active'
        }
    ]);

    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const departments = ['all', 'Engineering', 'Product', 'Design', 'Infrastructure', 'Data Science'];
    const statuses = ['all', 'Active', 'Reviewing', 'Draft'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-50 text-emerald-700';
            case 'Reviewing':
                return 'bg-amber-50 text-amber-700';
            case 'Draft':
                return 'bg-slate-50 text-slate-700';
            default:
                return 'bg-slate-50 text-slate-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Active':
                return CheckCircle;
            case 'Reviewing':
                return Clock;
            case 'Draft':
                return AlertCircle;
            default:
                return CheckCircle;
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredPositions.map(p => p.id));
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

    const filteredPositions = positions.filter(position => {
        const matchesSearch = position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            position.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = departmentFilter === 'all' || position.department === departmentFilter;
        const matchesStatus = statusFilter === 'all' || position.status === statusFilter;
        return matchesSearch && matchesDepartment && matchesStatus;
    });

    return (
        <div className="bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-slate-900">Positions</h1>
                    <p className="text-slate-600 mt-1">Browse available positions and generate tailored CVs.</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search positions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                                >
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>
                                            {dept === 'all' ? 'All Departments' : dept}
                                        </option>
                                    ))}
                                </select>
                                <Filter className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
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
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-slate-600">
                                Total Positions: <span className="font-medium text-slate-900">{positions.length}</span>
                            </span>
                            <span className="text-sm text-slate-600">
                                Visible: <span className="font-medium text-slate-900">{filteredPositions.length}</span>
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

                {/* Positions Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-3 px-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredPositions.length && filteredPositions.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                        />
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Position</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Department</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Deadline</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPositions.map((position) => {
                                    const StatusIcon = getStatusIcon(position.status);
                                    return (
                                        <tr
                                            key={position.id}
                                            onClick={() => navigate(`/positions/${position.id}`)}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(position.id)}
                                                    onChange={() => handleSelectOne(position.id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-900 font-medium">{position.title}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{position.department}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{position.deadline}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(position.status)}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {position.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredPositions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-sm text-slate-500">
                                            No positions found matching your filters
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

export default Positions;