'use client';

import React, { useEffect, useState } from 'react';
import {
    Building2,
    Tag,
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    Check,
    X,
    AlertCircle,
    FolderOpen,
    CheckSquare,
    Square,
} from 'lucide-react';
import {
    CompanyCategoryDto,
    CompanyDto,
    getCompanyCategories,
    createCompanyCategory,
    updateCompanyCategory,
    deleteCompanyCategory,
    getAllCompanies,
    updateCompany,
    bulkAssignCategory,
    syncCompaniesFromTransactions,
} from '@/services/companyService';

const CATEGORY_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
];

export default function CompaniesPage() {
    const [categories, setCategories] = useState<CompanyCategoryDto[]>([]);
    const [companies, setCompanies] = useState<CompanyDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Category form state
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CompanyCategoryDto | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: '',
        displayOrder: 0,
        color: CATEGORY_COLORS[0],
    });

    // Company selection state
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<number>>(new Set());
    const [bulkCategoryId, setBulkCategoryId] = useState<number>(0);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Syncing state
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catResult, compResult] = await Promise.all([
                getCompanyCategories(),
                getAllCompanies(),
            ]);

            if (catResult.data) setCategories(catResult.data);
            if (compResult.data) setCompanies(compResult.data);
        } catch (err: any) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        try {
            const result = await syncCompaniesFromTransactions();
            setSuccess(result.message || 'Sync completed');
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    // Category handlers
    const handleSaveCategory = async () => {
        setError(null);
        try {
            if (editingCategory) {
                await updateCompanyCategory(editingCategory.id, categoryForm);
                setSuccess('Category updated');
            } else {
                await createCompanyCategory(categoryForm);
                setSuccess('Category created');
            }
            setShowCategoryForm(false);
            setEditingCategory(null);
            setCategoryForm({ name: '', description: '', displayOrder: 0, color: CATEGORY_COLORS[0] });
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Failed to save category');
        }
    };

    const handleEditCategory = (cat: CompanyCategoryDto) => {
        setEditingCategory(cat);
        setCategoryForm({
            name: cat.name,
            description: cat.description || '',
            displayOrder: cat.displayOrder,
            color: cat.color || CATEGORY_COLORS[0],
        });
        setShowCategoryForm(true);
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Delete this category? Companies will become uncategorized.')) return;
        try {
            await deleteCompanyCategory(id);
            setSuccess('Category deleted');
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Failed to delete category');
        }
    };

    // Company handlers
    const handleCompanySelect = (id: number) => {
        setSelectedCompanyIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        const filtered = getFilteredCompanies();
        if (selectedCompanyIds.size === filtered.length) {
            setSelectedCompanyIds(new Set());
        } else {
            setSelectedCompanyIds(new Set(filtered.map(c => c.id)));
        }
    };

    const handleBulkAssign = async () => {
        if (selectedCompanyIds.size === 0) {
            setError('Select at least one company');
            return;
        }
        try {
            await bulkAssignCategory({
                companyIds: Array.from(selectedCompanyIds),
                categoryId: bulkCategoryId,
            });
            setSuccess(`Updated ${selectedCompanyIds.size} companies`);
            setSelectedCompanyIds(new Set());
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Failed to assign category');
        }
    };

    const handleCompanyCategoryChange = async (companyId: number, categoryId: number) => {
        try {
            await updateCompany(companyId, { companyCategoryId: categoryId || null });
            await loadData();
        } catch (err: any) {
            setError('Failed to update company');
        }
    };

    const getFilteredCompanies = () => {
        let filtered = companies;

        if (filterCategory === 'uncategorized') {
            filtered = filtered.filter(c => !c.companyCategoryId);
        } else if (filterCategory !== 'all') {
            const catId = parseInt(filterCategory);
            filtered = filtered.filter(c => c.companyCategoryId === catId);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.categoryName?.toLowerCase().includes(term)
            );
        }

        return filtered;
    };

    const filteredCompanies = getFilteredCompanies();
    const uncategorizedCount = companies.filter(c => !c.companyCategoryId).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-indigo-600" />
                        Company Management
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Manage companies and their categories for revenue reports
                    </p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    Sync from Transactions
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {success}
                    <button onClick={() => setSuccess(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Categories Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-indigo-600" />
                        Categories
                    </h2>
                    <button
                        onClick={() => {
                            setShowCategoryForm(true);
                            setEditingCategory(null);
                            setCategoryForm({ name: '', description: '', displayOrder: categories.length, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length] });
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Category
                    </button>
                </div>

                {/* Category Form */}
                {showCategoryForm && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-medium mb-3">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    placeholder="e.g., International"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={categoryForm.description}
                                    onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    placeholder="Optional description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
                                <input
                                    type="number"
                                    value={categoryForm.displayOrder}
                                    onChange={e => setCategoryForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                <div className="flex gap-1 flex-wrap">
                                    {CATEGORY_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                                            className={`w-6 h-6 rounded-full border-2 ${categoryForm.color === color ? 'border-slate-900' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleSaveCategory}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                            >
                                <Check className="w-4 h-4" />
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setShowCategoryForm(false);
                                    setEditingCategory(null);
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Categories List */}
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.color || '#6B7280' }}
                            />
                            <span className="font-medium">{cat.name}</span>
                            <span className="text-sm text-slate-500">({cat.companyCount})</span>
                            <button
                                onClick={() => handleEditCategory(cat)}
                                className="p-1 text-slate-400 hover:text-indigo-600"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 text-slate-400 hover:text-red-600"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <p className="text-slate-500 text-sm">No categories yet. Create one to get started.</p>
                    )}
                </div>
            </div>

            {/* Companies Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Companies
                        <span className="text-sm font-normal text-slate-500">({companies.length} total)</span>
                        {uncategorizedCount > 0 && (
                            <span className="text-sm font-normal text-amber-600">
                ({uncategorizedCount} uncategorized)
              </span>
                        )}
                    </h2>
                </div>

                {/* Filters and Bulk Actions */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Category</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="all">All Companies</option>
                            <option value="uncategorized">Uncategorized</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="Search companies..."
                        />
                    </div>
                    <div className="flex-1" />
                    {selectedCompanyIds.size > 0 && (
                        <div className="flex items-end gap-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Assign {selectedCompanyIds.size} selected to:
                                </label>
                                <select
                                    value={bulkCategoryId}
                                    onChange={e => setBulkCategoryId(parseInt(e.target.value))}
                                    className="px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value={0}>-- Remove Category --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleBulkAssign}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>

                {/* Companies Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <button onClick={handleSelectAll} className="flex items-center gap-2">
                                    {selectedCompanyIds.size === filteredCompanies.length && filteredCompanies.length > 0 ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Company Name</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Category</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">First Seen</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredCompanies.map(company => (
                            <tr key={company.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <button onClick={() => handleCompanySelect(company.id)}>
                                        {selectedCompanyIds.has(company.id) ? (
                                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-900">{company.name}</td>
                                <td className="px-4 py-3">
                                    <select
                                        value={company.companyCategoryId || ''}
                                        onChange={e => handleCompanyCategoryChange(company.id, parseInt(e.target.value) || 0)}
                                        className="px-2 py-1 border border-slate-200 rounded text-sm"
                                    >
                                        <option value="">Uncategorized</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                    {new Date(company.firstSeenAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {filteredCompanies.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    No companies found
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}