import {
    MapPin,
    Briefcase,
    FolderKanban,
    FileText,
    Award,
    Code,
    Edit
} from 'lucide-react';
import useAuth from "../hooks/useAuth";
import { useState } from 'react';

const Profile = () => {
    const { user } = useAuth();

    // TODO: Load attributes from API
    const [attributes] = useState([
        { label: 'IELTS Score', value: '7.5' },
        { label: 'Remote Work', value: 'Available' },
        { label: 'Presentation Skills', value: 'Advanced' },
        { label: 'English Level', value: 'C1' }
    ]);

    // TODO: Load skills from API
    const [skills] = useState([
        'React', 'Node.js', 'Express', 'PostgreSQL',
        'Prisma', 'Tailwind CSS', 'TypeScript', 'Docker'
    ]);

    // TODO: Fetch projects from API
    const [projects] = useState([
        { id: 1, name: 'CV Management System', period: '2026 - Present', technologies: 'React, Tailwind CSS, Express, PostgreSQL' },
        { id: 2, name: 'E-Commerce Platform', period: '2025 - 2026', technologies: 'Next.js, Stripe, MongoDB, Redis' },
        { id: 3, name: 'HR Analytics Dashboard', period: '2024 - 2025', technologies: 'React, D3.js, Node.js, PostgreSQL' },
        { id: 4, name: 'Task Management App', period: '2023 - 2024', technologies: 'React, Redux, Express, MongoDB' }
    ]);

    // TODO: Fetch CVs from API
    const [cvs] = useState([
        { id: 1, position: 'Senior Frontend Developer', status: 'Published', createdDate: '2026-03-15' },
        { id: 2, position: 'Full Stack Developer', status: 'Draft', createdDate: '2026-02-20' },
        { id: 3, position: 'React Developer', status: 'Hidden', createdDate: '2026-01-10' },
        { id: 4, position: 'Node.js Developer', status: 'Published', createdDate: '2025-12-05' }
    ]);

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

    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`;
    const profilePhoto = user?.profilePhoto || null;
    const location = user?.location || 'Location not provided';
    const role = user?.role || 'Role not specified';

    const stats = [
        { label: 'Projects', value: projects.length, icon: FolderKanban },
        { label: 'CVs', value: cvs.length, icon: FileText },
        { label: 'Skills', value: skills.length, icon: Code },
        { label: 'Attributes', value: attributes.length, icon: Award }
    ];

    return (
        <div className="bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Profile Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                {profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt={fullName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    user?.firstName?.charAt(0) || 'U'
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{fullName || 'User'}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <MapPin className="h-4 w-4" />
                                        <span>{location}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <Briefcase className="h-4 w-4" />
                                        <span>{role}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            <Edit className="h-4 w-4" />
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Profile Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                </div>
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* About Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Passionate full stack developer with 6+ years of experience building enterprise-scale web applications. Expertise in React, Node.js, and modern JavaScript technologies. Committed to delivering high-quality, maintainable code and mentoring junior developers.
                    </p>
                </div>

                {/* Attributes Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3">Attributes</h2>
                    <div className="flex flex-wrap gap-2">
                        {attributes.map((attr, index) => (
                            <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm">
                                <span className="font-medium">{attr.label}:</span>
                                <span>{attr.value}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Skills Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Projects Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Projects</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Project Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Period</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Technologies</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => (
                                    <tr key={project.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{project.name}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{project.period}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{project.technologies}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CVs Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">CVs</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Position</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Created Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cvs.map((cv) => (
                                    <tr key={cv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{cv.position}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cv.status)}`}>
                                                {cv.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{cv.createdDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;