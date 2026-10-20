import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  Archive,
  Star,
  StarOff,
  ExternalLink,
  RefreshCw,
  X,
  FileText,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { GovernmentScheme, CreateSchemeInput, GovernmentLevel, SchemeStatus } from '../../types/scheme.js';

interface AdminSchemesViewProps {
  onStatsUpdated?: () => void;
}

const CATEGORIES = [
  'Financial Assistance',
  'Crop Insurance',
  'Agriculture',
  'Irrigation',
  'Equipment Subsidy',
  'Farmer Loans',
  'Livestock',
  'Organic Farming',
];

export const AdminSchemesView: React.FC<AdminSchemesViewProps> = ({ onStatsUpdated }) => {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GovernmentScheme | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<CreateSchemeInput>({
    title: '',
    short_description: '',
    full_description: '',
    category: 'Financial Assistance',
    government_level: 'CENTRAL',
    state: 'Karnataka',
    department: '',
    benefits: '',
    eligibility: '',
    required_documents: '',
    application_process: '',
    official_url: '',
    helpline: '',
    image_url: '',
    status: 'PUBLISHED',
    featured: false,
  });

  const fetchSchemes = async () => {
    setIsLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        government_level: levelFilter !== 'ALL' ? levelFilter : undefined,
      };
      const res = await adminApi.getSchemes(params);
      if (res.data?.success) {
        setSchemes(res.data.data || []);
      }
    } catch (err) {
      console.error('[AdminSchemesView] Error fetching schemes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [statusFilter, levelFilter]);

  const openCreateModal = () => {
    setEditingScheme(null);
    setFormData({
      title: '',
      short_description: '',
      full_description: '',
      category: 'Financial Assistance',
      government_level: 'CENTRAL',
      state: 'Karnataka',
      department: '',
      benefits: '',
      eligibility: '',
      required_documents: '',
      application_process: '',
      official_url: '',
      helpline: '',
      image_url: '',
      status: 'PUBLISHED',
      featured: false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (scheme: GovernmentScheme) => {
    setEditingScheme(scheme);
    setFormData({
      title: scheme.title,
      short_description: scheme.short_description,
      full_description: scheme.full_description,
      category: scheme.category,
      government_level: scheme.government_level,
      state: scheme.state || 'Karnataka',
      department: scheme.department || '',
      benefits: scheme.benefits || '',
      eligibility: scheme.eligibility || '',
      required_documents: scheme.required_documents || '',
      application_process: scheme.application_process || '',
      official_url: scheme.official_url || '',
      helpline: scheme.helpline || '',
      image_url: scheme.image_url || '',
      status: scheme.status,
      featured: scheme.featured,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Scheme title is required');
      return;
    }
    if (!formData.short_description.trim()) {
      setFormError('Short description is required');
      return;
    }
    if (!formData.full_description.trim()) {
      setFormError('Full description is required');
      return;
    }
    if (formData.official_url && !formData.official_url.startsWith('https://') && !formData.official_url.startsWith('http://')) {
      setFormError('Official URL must start with http:// or https://');
      return;
    }

    setFormLoading(true);
    try {
      if (editingScheme) {
        await adminApi.updateScheme(editingScheme.id, formData);
      } else {
        await adminApi.createScheme(formData);
      }
      setIsModalOpen(false);
      fetchSchemes();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err: any) {
      console.error('[AdminSchemesView] Error saving scheme:', err);
      setFormError(err.response?.data?.error || 'Failed to save scheme. Please verify inputs.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTogglePublish = async (scheme: GovernmentScheme) => {
    try {
      if (scheme.status === 'PUBLISHED') {
        await adminApi.archiveScheme(scheme.id);
      } else {
        await adminApi.publishScheme(scheme.id);
      }
      fetchSchemes();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      console.error('[AdminSchemesView] Error updating status:', err);
    }
  };

  const handleToggleFeature = async (scheme: GovernmentScheme) => {
    try {
      if (scheme.featured) {
        await adminApi.unfeatureScheme(scheme.id);
      } else {
        await adminApi.featureScheme(scheme.id);
      }
      fetchSchemes();
    } catch (err) {
      console.error('[AdminSchemesView] Error updating featured:', err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete scheme "${title}"?`)) {
      return;
    }
    try {
      await adminApi.deleteScheme(id);
      fetchSchemes();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      console.error('[AdminSchemesView] Error deleting scheme:', err);
    }
  };

  // Metrics summary
  const totalCount = schemes.length;
  const publishedCount = schemes.filter((s) => s.status === 'PUBLISHED').length;
  const draftCount = schemes.filter((s) => s.status === 'DRAFT').length;
  const featuredCount = schemes.filter((s) => s.featured).length;

  return (
    <div id="admin-schemes-view-container" className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Schemes</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Published</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{publishedCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Drafts</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{draftCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Featured</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{featuredCount}</div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Government Schemes Management</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Publish, update, feature, and manage official Central and Karnataka State agricultural schemes.
            </p>
          </div>

          <button
            id="admin-create-scheme-btn"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Scheme</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2 border-t border-neutral-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="admin-scheme-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSchemes()}
              placeholder="Search schemes by title, category, or department..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              id="admin-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              id="admin-level-filter"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2"
            >
              <option value="ALL">All Levels</option>
              <option value="CENTRAL">Central</option>
              <option value="STATE">State (Karnataka)</option>
            </select>

            <button
              onClick={fetchSchemes}
              title="Refresh list"
              className="p-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Schemes List Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-neutral-500">Loading scheme records...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
          <Building2 className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-neutral-800">No Schemes Found</h3>
          <p className="text-xs text-neutral-500 mt-1">Try changing filters or add your first scheme.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Scheme Title</th>
                  <th className="px-4 py-3">Level & State</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {schemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-bold text-neutral-900 line-clamp-1">{scheme.title}</div>
                      <div className="text-neutral-500 text-[11px] line-clamp-1 mt-0.5">
                        {scheme.department || scheme.short_description}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                          scheme.government_level === 'CENTRAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {scheme.government_level === 'CENTRAL' ? 'Central' : scheme.state || 'State'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{scheme.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                          scheme.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scheme.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {scheme.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        id={`admin-scheme-star-btn-${scheme.id}`}
                        onClick={() => handleToggleFeature(scheme)}
                        title={scheme.featured ? 'Unfeature scheme' : 'Feature scheme'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          scheme.featured
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {scheme.featured ? <Star className="w-4 h-4 fill-amber-500" /> : <StarOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                      {scheme.official_url && (
                        <a
                          href={scheme.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open official portal"
                          className="p-1.5 text-neutral-400 hover:text-emerald-700 hover:bg-neutral-100 rounded-lg inline-block transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        id={`admin-scheme-publish-toggle-${scheme.id}`}
                        onClick={() => handleTogglePublish(scheme)}
                        title={scheme.status === 'PUBLISHED' ? 'Archive scheme' : 'Publish scheme'}
                        className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        {scheme.status === 'PUBLISHED' ? (
                          <Archive className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                      <button
                        id={`admin-scheme-edit-btn-${scheme.id}`}
                        onClick={() => openEditModal(scheme)}
                        title="Edit scheme"
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`admin-scheme-delete-btn-${scheme.id}`}
                        onClick={() => handleDelete(scheme.id, scheme.title)}
                        title="Delete scheme"
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          id="admin-scheme-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => !formLoading && setIsModalOpen(false)}
        >
          <div
            id="admin-scheme-modal-card"
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>{editingScheme ? 'Edit Government Scheme' : 'Add New Government Scheme'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={formLoading}
                className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Scheme Title *
                  </label>
                  <input
                    id="form-scheme-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. PM-Kisan Samman Nidhi"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Category *</label>
                  <select
                    id="form-scheme-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Government Level & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Government Level *
                  </label>
                  <select
                    id="form-scheme-level"
                    value={formData.government_level}
                    onChange={(e) =>
                      setFormData({ ...formData, government_level: e.target.value as GovernmentLevel })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                  >
                    <option value="CENTRAL">Central Government</option>
                    <option value="STATE">State Government</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">State</label>
                  <input
                    id="form-scheme-state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Department / Ministry
                </label>
                <input
                  id="form-scheme-dept"
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Ministry of Agriculture & Farmers Welfare, Govt of India"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Short Description * (Summarized in 1-2 sentences)
                </label>
                <input
                  id="form-scheme-short-desc"
                  type="text"
                  required
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Direct income support of ₹6,000 per year in three installments for landholding farmer families."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Description *
                </label>
                <textarea
                  id="form-scheme-full-desc"
                  rows={3}
                  required
                  value={formData.full_description}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  placeholder="Comprehensive description of the scheme, scope, and objectives..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Benefits & Subsidies
                </label>
                <textarea
                  id="form-scheme-benefits"
                  rows={3}
                  value={formData.benefits || ''}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="• ₹6,000/year credited directly to Aadhaar-seeded bank account&#10;• 3 equal installments of ₹2,000"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>

              {/* Eligibility */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Eligibility Criteria
                </label>
                <textarea
                  id="form-scheme-eligibility"
                  rows={2}
                  value={formData.eligibility || ''}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="All landholding farmer families with cultivable land in their names..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>

              {/* Required Documents */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Required Documents
                </label>
                <textarea
                  id="form-scheme-documents"
                  rows={2}
                  value={formData.required_documents || ''}
                  onChange={(e) => setFormData({ ...formData, required_documents: e.target.value })}
                  placeholder="Aadhaar Card, Land Records (Pahani / RTC), Bank Passbook, Mobile number"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>

              {/* Application Process */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Application Process
                </label>
                <textarea
                  id="form-scheme-process"
                  rows={2}
                  value={formData.application_process || ''}
                  onChange={(e) => setFormData({ ...formData, application_process: e.target.value })}
                  placeholder="Apply online at pmkisan.gov.in or visit local Common Service Centre (CSC) or Raitha Samparka Kendra."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>

              {/* Official URL & Helpline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Official Portal URL
                  </label>
                  <input
                    id="form-scheme-url"
                    type="url"
                    value={formData.official_url || ''}
                    onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                    placeholder="https://pmkisan.gov.in"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Official Helpline
                  </label>
                  <input
                    id="form-scheme-helpline"
                    type="text"
                    value={formData.helpline || ''}
                    onChange={(e) => setFormData({ ...formData, helpline: e.target.value })}
                    placeholder="155261 / 011-24300606"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                  />
                </div>
              </div>

              {/* Status & Featured Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                  <select
                    id="form-scheme-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SchemeStatus })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                  >
                    <option value="PUBLISHED">Published (Visible to farmers)</option>
                    <option value="DRAFT">Draft (Hidden)</option>
                    <option value="ARCHIVED">Archived (Inactive)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="form-scheme-featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <label htmlFor="form-scheme-featured" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                    Feature on Farmer Dashboard Highlights
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-medium rounded-xl transition-colors text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  id="admin-save-scheme-btn"
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-xs sm:text-sm shadow-2xs flex items-center gap-1.5"
                >
                  {formLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingScheme ? 'Update Scheme' : 'Create Scheme'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
