// client/src/pages/admin/users/AdminUsers.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../api/axios';
import {
    Search,
    UserCheck,
    UserX,
    Shield,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';

const PAGE_LIMIT = 10;

const formatRole = (role) => {
    if (!role) return '—';
    if (role === 'CANDIDATE') return 'Candidate';
    if (role === 'RECRUITER') return 'Recruiter';
    if (role === 'ADMIN') return 'Administrator';
    return role;
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    } catch {
        return '—';
    }
};

const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return f + l || '?';
};

const getSafeCount = (count) => {
    return typeof count === 'number' && !isNaN(count) ? count : 0;
};

const getSafeNonNegativeInteger = (value, fallback) => {
    return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
};

const AdminUsers = () => {
    const { user: currentUser, refreshAuth } = useAuth();

    // State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_LIMIT,
        totalItems: 0,
        totalPages: 0,
    });
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

    const selectAllRef = useRef(null);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        // Do NOT clear successMessage here
        try {
            const params = {
                page,
                limit: PAGE_LIMIT,
                status: statusFilter,
            };
            if (appliedSearch && appliedSearch.trim()) {
                params.search = appliedSearch.trim();
            }
            if (roleFilter) {
                params.role = roleFilter;
            }

            const response = await api.get('/admin/users', { params });
            const data = response.data?.data || {};
            const fetchedUsers = Array.isArray(data.users) ? data.users : [];
            const rawPagination =
                data.pagination && typeof data.pagination === 'object'
                    ? data.pagination
                    : {};

            const safePagination = {
                page: getSafeNonNegativeInteger(rawPagination.page, page),
                limit: getSafeNonNegativeInteger(rawPagination.limit, PAGE_LIMIT),
                totalItems: getSafeNonNegativeInteger(rawPagination.totalItems, 0),
                totalPages: getSafeNonNegativeInteger(rawPagination.totalPages, 0),
            };

            setUsers(fetchedUsers);
            setPagination(safePagination);

            // Remove selected IDs that are no longer visible
            setSelectedIds((prev) =>
                prev.filter((id) => fetchedUsers.some((u) => u.id === id))
            );
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to load users. Please try again.'
            );
            setUsers([]);
            setPagination({
                page: 1,
                limit: PAGE_LIMIT,
                totalItems: 0,
                totalPages: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [appliedSearch, roleFilter, statusFilter, page]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            fetchUsers();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [fetchUsers]);

    // Handle indeterminate state for select-all checkbox
    useEffect(() => {
        if (selectAllRef.current) {
            const visibleIds = users.map((u) => u.id);
            const selectedVisible = selectedIds.filter((id) =>
                visibleIds.includes(id)
            );
            if (selectedVisible.length === 0) {
                selectAllRef.current.checked = false;
                selectAllRef.current.indeterminate = false;
            } else if (selectedVisible.length === visibleIds.length) {
                selectAllRef.current.checked = true;
                selectAllRef.current.indeterminate = false;
            } else {
                selectAllRef.current.checked = false;
                selectAllRef.current.indeterminate = true;
            }
        }
    }, [selectedIds, users]);

    // Search handlers
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (trimmed.length > 100) {
            setError('Search cannot exceed 100 characters.');
            return;
        }
        setAppliedSearch(trimmed);
        setPage(1);
        setSelectedIds([]);
        setSuccessMessage('');
        setError('');
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setAppliedSearch('');
        setPage(1);
        setSelectedIds([]);
        setSuccessMessage('');
        setError('');
    };

    // Filter handlers
    const handleRoleChange = (e) => {
        setRoleFilter(e.target.value);
        setPage(1);
        setSelectedIds([]);
        setSuccessMessage('');
        setError('');
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPage(1);
        setSelectedIds([]);
        setSuccessMessage('');
        setError('');
    };

    // Selection handlers
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        const visibleIds = users.map((u) => u.id);
        if (checked) {
            setSelectedIds((prev) => {
                const combined = new Set([...prev, ...visibleIds]);
                return Array.from(combined);
            });
        } else {
            setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((selectedId) => selectedId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Action handlers
    const handleRoleUpdate = async (role) => {
        if (selectedIds.length === 0 || actionLoading) return;
        setActionLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.patch('/admin/users/roles', {
                userIds: selectedIds,
                role,
            });
            setSuccessMessage(response.data?.message || 'User roles updated successfully.');
            const wasSelfSelected = selectedIds.includes(currentUser?.id);
            setSelectedIds([]);
            if (wasSelfSelected) {
                await refreshAuth();
            } else {
                await fetchUsers();
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to update users. Please try again.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlockStatusUpdate = async (isBlocked) => {
        if (selectedIds.length === 0 || actionLoading) return;
        setActionLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.patch('/admin/users/block-status', {
                userIds: selectedIds,
                isBlocked,
            });
            const msg = isBlocked
                ? 'Users blocked successfully.'
                : 'Users unblocked successfully.';
            setSuccessMessage(response.data?.message || msg);
            const wasSelfSelected = selectedIds.includes(currentUser?.id);
            setSelectedIds([]);
            if (wasSelfSelected) {
                await refreshAuth();
            } else {
                await fetchUsers();
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to update users. Please try again.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUsers = async () => {
        if (selectedIds.length === 0 || actionLoading) return;
        const wasSelfSelected = selectedIds.includes(currentUser?.id);
        const selectedCount = selectedIds.length;
        const currentPageUsers = users.length;

        setActionLoading(true);
        setError('');
        setSuccessMessage('');
        setDeleteConfirmationOpen(false);
        try {
            const response = await api.delete('/admin/users', {
                data: { userIds: selectedIds },
            });
            setSuccessMessage(response.data?.message || 'Users deleted successfully.');
            setSelectedIds([]);
            if (wasSelfSelected) {
                await refreshAuth();
            } else {
                if (currentPageUsers === selectedCount && page > 1) {
                    setPage((p) => p - 1);
                } else {
                    await fetchUsers();
                }
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to delete users. Please try again.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = () => {
        if (selectedIds.length === 0 || actionLoading) return;
        setDeleteConfirmationOpen(true);
    };

    // Pagination handlers
    const handlePrevPage = () => {
        if (page > 1 && !loading && !actionLoading) {
            setPage((p) => p - 1);
            setSelectedIds([]);
            setSuccessMessage('');
            setError('');
        }
    };

    const handleNextPage = () => {
        if (page < pagination.totalPages && !loading && !actionLoading) {
            setPage((p) => p + 1);
            setSelectedIds([]);
            setSuccessMessage('');
            setError('');
        }
    };

    // Render helpers
    const renderRoleBadge = (role) => {
        const colors = {
            CANDIDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            RECRUITER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
            ADMIN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        };
        const colorClass = colors[role] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                {formatRole(role)}
            </span>
        );
    };

    const renderStatusBadge = (isBlocked) => {
        if (isBlocked) {
            return (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    Blocked
                </span>
            );
        }
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Active
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        {pagination.totalItems} total users
                    </span>
                </div>

                {/* Error and success messages */}
                {error && (
                    <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div role="status" className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg text-sm">
                        {successMessage}
                    </div>
                )}

                {/* Filters and search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by name or email"
                                maxLength={100}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                disabled={loading || actionLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || actionLoading}
                        >
                            Search
                        </button>
                        {(searchInput || appliedSearch) && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || actionLoading}
                            >
                                Clear
                            </button>
                        )}
                    </form>

                    <div className="flex gap-3">
                        <div>
                            <label htmlFor="role-filter" className="sr-only">Role filter</label>
                            <select
                                id="role-filter"
                                value={roleFilter}
                                onChange={handleRoleChange}
                                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                disabled={loading || actionLoading}
                            >
                                <option value="">All roles</option>
                                <option value="CANDIDATE">Candidate</option>
                                <option value="RECRUITER">Recruiter</option>
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status-filter" className="sr-only">Status filter</label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={handleStatusChange}
                                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                disabled={loading || actionLoading}
                            >
                                <option value="ALL">All statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="BLOCKED">Blocked</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Selection toolbar */}
                <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[80px]">
                        {selectedIds.length === 0
                            ? '0 selected'
                            : selectedIds.length === 1
                                ? '1 selected'
                                : `${selectedIds.length} selected`}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleRoleUpdate('CANDIDATE')}
                            disabled={selectedIds.length === 0 || actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserCheck className="w-4 h-4" aria-hidden="true" />
                            Make Candidate
                        </button>
                        <button
                            onClick={() => handleRoleUpdate('RECRUITER')}
                            disabled={selectedIds.length === 0 || actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserCheck className="w-4 h-4" aria-hidden="true" />
                            Make Recruiter
                        </button>
                        <button
                            onClick={() => handleRoleUpdate('ADMIN')}
                            disabled={selectedIds.length === 0 || actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Shield className="w-4 h-4" aria-hidden="true" />
                            Make Admin
                        </button>
                        <button
                            onClick={() => handleBlockStatusUpdate(true)}
                            disabled={selectedIds.length === 0 || actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserX className="w-4 h-4" aria-hidden="true" />
                            Block
                        </button>
                        <button
                            onClick={() => handleBlockStatusUpdate(false)}
                            disabled={selectedIds.length === 0 || actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserCheck className="w-4 h-4" aria-hidden="true" />
                            Unblock
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            disabled={selectedIds.length === 0 || actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-4 py-3 w-10">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:bg-slate-900"
                                        disabled={loading || actionLoading || users.length === 0}
                                        aria-label="Select all users on this page"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                        No users found.
                                        {(appliedSearch || roleFilter || statusFilter !== 'ALL') && (
                                            <span className="block mt-1">Try changing the search or filters.</span>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const isCurrentUser = user.id === currentUser?.id;
                                    return (
                                        <tr
                                            key={user.id}
                                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(user.id)}
                                                    onChange={() => handleSelectOne(user.id)}
                                                    className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:bg-slate-900"
                                                    disabled={loading || actionLoading}
                                                    aria-label={`Select user ${user.firstName} ${user.lastName}`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {user.profilePhoto ? (
                                                        <img
                                                            src={user.profilePhoto}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                                                            {getInitials(user.firstName, user.lastName)}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {user.firstName} {user.lastName}
                                                        </span>
                                                        {isCurrentUser && (
                                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">(You)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {user.email || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {renderRoleBadge(user.role)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {renderStatusBadge(user.isBlocked)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {getSafeCount(user._count?.projects)} projects · {getSafeCount(user._count?.cvs)} CVs · {getSafeCount(user._count?.positions)} positions
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(user.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        Page {pagination.totalPages > 0 ? pagination.page : 0} of {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={page <= 1 || loading || actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={page >= pagination.totalPages || loading || actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Next page"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Delete confirmation modal */}
                {deleteConfirmationOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-dialog-title"
                        aria-describedby="delete-dialog-description"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 id="delete-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
                                    Delete selected users?
                                </h2>
                                <button
                                    onClick={() => setDeleteConfirmationOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                                    aria-label="Cancel deletion"
                                >
                                    <X className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                            <p id="delete-dialog-description" className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                This permanently deletes the selected user accounts and related personal data. Shared positions are preserved.
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                Selected: <span className="font-medium text-slate-900 dark:text-white">{selectedIds.length}</span> user{selectedIds.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirmationOpen(false)}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteUsers}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Delete users
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;