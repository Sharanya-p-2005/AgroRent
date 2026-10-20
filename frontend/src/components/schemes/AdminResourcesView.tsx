import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  Archive,
  RefreshCw,
  X,
  ExternalLink,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { FarmerResource, CreateResourceInput, ResourceType, ResourceStatus } from '../../types/scheme.js';

interface AdminResourcesViewProps {
  onStatsUpdated?: () => void;
}

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'GUIDE', label: 'Practical Guide' },
  { value: 'ARTICLE', label: 'Technical Article' },
  { value: 'DOCUMENT', label: 'Document / Manual' },
  { value: 'HELPLINE', label: 'Helpline & Contacts' },
  { value: 'VIDEO', label: 'Video Workshop' },
  { value: 'WEBSITE', label: 'External Directory' },
];

export const AdminResourcesView: React.FC<AdminResourcesViewProps> = ({ onStatsUpdated }) => {
  const [resources, setResources] = useState<FarmerResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<FarmerResource | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<CreateResourceInput>({
    title: '',
    description: '',
    category: 'Agronomy',
    content: '',
    resource_type: 'GUIDE',
    image_url: '',
    official_url: '',
    status: 'PUBLISHED',
  });

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        resource_type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      };
      const res = await adminApi.getResources(params);
      if (res.data?.success) {
        setResources(res.data.data || []);
      }
    } catch (err) {
      console.error('[AdminResourcesView] Error fetching resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [typeFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      category: 'Agronomy',
      content: '',
      resource_type: 'GUIDE',
      image_url: '',
      official_url: '',
      status: 'PUBLISHED',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (resource: FarmerResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      content: resource.content,
      resource_type: resource.resource_type,
      image_url: resource.image_url || '',
      official_url: resource.official_url || '',
      status: resource.status,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.description.trim() || !formData.content.trim()) {
      setFormError('Title, description, and content body are required.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingResource) {
        await adminApi.updateResource(editingResource.id, formData);
      } else {
        await adminApi.createResource(formData);
      }
      setIsModalOpen(false);
      fetchResources();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err: any) {
      console.error('[AdminResourcesView] Error saving resource:', err);
      setFormError(err.response?.data?.error || 'Failed to save resource.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTogglePublish = async (res: FarmerResource) => {
    try {
      if (res.status === 'PUBLISHED') {
        await adminApi.archiveResource(res.id);
      } else {
        await adminApi.publishResource(res.id);
      }
      fetchResources();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      console.error('[AdminResourcesView] Error updating status:', err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete educational resource "${title}"?`)) return;
    try {
      await adminApi.deleteResource(id);
      fetchResources();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      console.error('[AdminResourcesView] Error deleting resource:', err);
    }
  };

  return (
    <div id="admin-resources-view-container" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Farmer Educational Resources & Guides</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Manage agronomy manuals, seasonal crop advisory, pest management guides, and state helpline directories.
            </p>
          </div>

          <button
            id="admin-create-resource-btn"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Resource</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-neutral-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchResources()}
              placeholder="Search resources by title or category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2"
            >
              <option value="ALL">All Types</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <button
              onClick={fetchResources}
              title="Refresh list"
              className="p-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-neutral-500">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
          <BookOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-neutral-800">No Resources Found</h3>
          <p className="text-xs text-neutral-500 mt-1">Create your first educational resource guide.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Resource Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 max-w-sm">
                      <div className="font-bold text-neutral-900 line-clamp-1">{res.title}</div>
                      <div className="text-neutral-500 text-[11px] line-clamp-1 mt-0.5">{res.description}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-800 uppercase">
                        {res.resource_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{res.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                          res.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                      {res.official_url && (
                        <a
                          href={res.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-neutral-400 hover:text-emerald-700 hover:bg-neutral-100 rounded-lg inline-block transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleTogglePublish(res)}
                        title={res.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                        className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        {res.status === 'PUBLISHED' ? <Archive className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => openEditModal(res)}
                        title="Edit"
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(res.id, res.title)}
                        title="Delete"
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

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div
          id="admin-resource-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => !formLoading && setIsModalOpen(false)}
        >
          <div
            id="admin-resource-modal-card"
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>{editingResource ? 'Edit Educational Resource' : 'Add New Educational Resource'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={formLoading}
                className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Soil Health Card Guide: How to Interpret & Test"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Resource Type *</label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value as ResourceType })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Soil Health & Testing"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Short Summary / Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Step-by-step instructions on collecting core soil samples and testing..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Content / Advisory *</label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide detailed instructions, step 1, step 2, expert advice..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">External Portal / Document Link</label>
                  <input
                    type="url"
                    value={formData.official_url || ''}
                    onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                    placeholder="https://soilhealth.dac.gov.in"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ResourceStatus })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-medium rounded-xl text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5"
                >
                  {formLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingResource ? 'Update Resource' : 'Create Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
