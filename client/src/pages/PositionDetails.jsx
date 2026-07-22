import React, { useState } from 'react';
import {
    Briefcase,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Heart,
    MessageSquare,
    Users,
    Plus
} from 'lucide-react';

const PositionDetails = () => {
    // TODO: Load position from API
    const [position] = useState({
        id: 1,
        title: 'Senior Frontend Developer',
        description: 'We are looking for an experienced Frontend Developer to join our engineering team. You will be responsible for building and maintaining high-quality web applications using modern JavaScript technologies.',
        status: 'Active',
        submittedCVs: 24,
        publishedCVs: 12,
        likes: 8
    });

    // TODO: Load attributes from API
    const [attributes] = useState([
        { attribute: 'Years of Experience', type: 'Number', required: 'Yes' },
        { attribute: 'React Experience', type: 'Years', required: 'Yes' },
        { attribute: 'TypeScript', type: 'Boolean', required: 'Yes' },
        { attribute: 'Node.js', type: 'Boolean', required: 'No' },
        { attribute: 'Team Leadership', type: 'Boolean', required: 'No' }
    ]);

    // TODO: Load project tags from API
    const [projectTags] = useState([
        'React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'GraphQL', 'Jest'
    ]);

    // TODO: Load access rules from API
    const [accessRules] = useState([
        'IELTS Score > 7.0',
        'Remote Work = Yes',
        'Presentation Skills = Advanced',
        'English Level = C1'
    ]);

    // TODO: Load discussions from API
    const [discussions] = useState([
        { id: 1, author: 'John Doe', message: 'Can you clarify the React experience requirements?', timestamp: '2 hours ago' },
        { id: 2, author: 'Sarah Chen', message: 'What about remote work policy for this position?', timestamp: '4 hours ago' },
        { id: 3, author: 'Michael Brown', message: 'Is there any visa sponsorship available?', timestamp: '1 day ago' }
    ]);

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

    const stats = [
        { label: 'Submitted CVs', value: position.submittedCVs, icon: FileText },
        { label: 'Published CVs', value: position.publishedCVs, icon: CheckCircle },
        { label: 'Likes', value: position.likes, icon: Heart }
    ];

    return (
        <div className="bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Position Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{position.title}</h1>
                            <p className="text-slate-600 mt-2 max-w-2xl">{position.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(position.status)}`}>
                                {position.status === 'Active' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                {position.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Position Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                {/* Action Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>Position ID: #{position.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                <Plus className="h-4 w-4" />
                                Create CV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Required Attributes */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Required Attributes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Attribute</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Required</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attributes.map((attr, index) => (
                                    <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{attr.attribute}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{attr.type}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${attr.required === 'Yes' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700'}`}>
                                                {attr.required}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Project Tags */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3">Project Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {projectTags.map((tag, index) => (
                            <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Access Rules */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3">Access Rules</h2>
                    <div className="space-y-2">
                        {accessRules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <span>{rule}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Discussion Preview */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Recent Discussions</h2>
                        <span className="text-sm text-blue-600 cursor-pointer hover:underline">View All</span>
                    </div>
                    <div className="space-y-4">
                        {discussions.map((discussion) => (
                            <div key={discussion.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border-l-4 border-blue-500">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex-shrink-0">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-medium text-slate-900">{discussion.author}</h3>
                                        <span className="text-xs text-slate-400">{discussion.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-0.5">{discussion.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PositionDetails;