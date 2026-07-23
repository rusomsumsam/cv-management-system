import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../api/axios";
import { ArrowLeft, Edit2, FileText, AlertCircle, Heart } from 'lucide-react';

const GeneratedCVView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likesCount, setLikesCount] = useState(0);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        const fetchCV = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/cvs/${id}`);
                setCv(response.data.data);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load CV');
                console.error('Error fetching CV:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchLikes = async () => {
            try {
                const response = await api.get("/likes");
                const likes = response.data.data || [];
                const cvLikes = likes.filter(like => like.cvId === id);
                setLikesCount(cvLikes.length);
            } catch (err) {
                console.error("Error fetching likes:", err);
            }
        };

        fetchCV();
        fetchLikes();
    }, [id]);

    const handleBack = () => {
        navigate('/my-cvs');
    };

    const handleEdit = () => {
        navigate(`/cvs/edit/${id}`);
    };

    const handleLike = async () => {
        if (liking) return;

        try {
            setLiking(true);
            await api.post("/likes", { cvId: id });

            // Refresh likes count
            const response = await api.get("/likes");
            const likes = response.data.data || [];
            const cvLikes = likes.filter(like => like.cvId === id);
            setLikesCount(cvLikes.length);
        } catch (err) {
            console.error("Error liking CV:", err);
        } finally {
            setLiking(false);
        }
    };

    const isEmpty = (value) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    };

    const renderSection = (title, content, renderContent) => {
        const empty = isEmpty(content);
        return (
            <div className={`p-6 rounded-lg ${empty ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    {empty && (
                        <div className="flex items-center text-red-600 text-sm font-medium">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Missing Information
                        </div>
                    )}
                </div>
                {empty ? (
                    <div className="text-red-700 italic">No information provided</div>
                ) : (
                    renderContent()
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Loading CV...</p>
                </div>
            </div>
        );
    }

    if (error || !cv) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading CV</h2>
                    <p className="text-gray-600">{error || 'CV not found'}</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Generated CV</h1>
                            <p className="text-gray-600 mt-1">Automatically generated CV for this position.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${cv.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {cv.status || 'DRAFT'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Resume Paper */}
                <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
                    {/* Personal Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-100 pb-2">
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                <p className="text-gray-900 font-medium">{cv.fullName || 'Not provided'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <p className="text-gray-900">{cv.email || 'Not provided'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-500">Phone</label>
                                <p className="text-gray-900">{cv.phone || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Professional Summary */}
                    {renderSection(
                        'Professional Summary',
                        cv.summary,
                        () => (
                            <p className="text-gray-700 leading-relaxed">{cv.summary}</p>
                        )
                    )}

                    {/* Skills */}
                    {renderSection(
                        'Skills',
                        cv.skills,
                        () => (
                            <div className="flex flex-wrap gap-2">
                                {cv.skills?.split(',').map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                                    >
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        )
                    )}

                    {/* Education */}
                    {renderSection(
                        'Education',
                        cv.education,
                        () => (
                            <p className="text-gray-700 leading-relaxed">
                                {cv.education}
                            </p>
                        )
                    )}

                    {/* Experience */}
                    {renderSection(
                        'Experience',
                        cv.experience,
                        () => (
                            <p className="text-gray-700 leading-relaxed">
                                {cv.experience}
                            </p>
                        )
                    )}

                    {/* Projects */}
                    {renderSection(
                        'Projects',
                        cv.projects,
                        () => (
                            <p className="text-gray-700 leading-relaxed">
                                {cv.projects}
                            </p>
                        )
                    )}

                    {/* Position Information */}
                    {cv.position && (
                        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
                                Position Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Position Title</label>
                                    <p className="text-gray-900 font-semibold">{cv.position.title || 'Not specified'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Description</label>
                                    <p className="text-gray-700">{cv.position.description || 'No description provided'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Company</label>
                                    <p className="text-gray-900">{cv.position.company || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Location</label>
                                    <p className="text-gray-900">{cv.position.location || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Department</label>
                                    <p className="text-gray-900">{cv.position.department || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleBack}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <button
                        onClick={handleEdit}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit2 className="w-5 h-5" />
                        Edit CV
                    </button>
                    <button
                        onClick={handleLike}
                        disabled={liking}
                        className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Heart className={`w-5 h-5 ${liking ? 'animate-pulse' : ''}`} />
                        {liking ? 'Liking...' : `Like CV (${likesCount})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneratedCVView;