"use client";

import { useState, useTransition } from "react";
import { EmailTemplate, saveEmailTemplates } from "./actions";
import { Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface TemplatesClientProps {
  initialTemplates: EmailTemplate[];
}

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const confirm = useConfirm();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});

  const handleAddNew = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setEditingId(newId);
    setEditForm({
      id: newId,
      name: "",
      subject: "",
      body: ""
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setEditForm({ ...template });
  };

  const handleDelete = async (id: string) => {
    const template = templates.find(t => t.id === id);
    const confirmed = await confirm({
      title: "Delete Email Template",
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to delete <span className="font-semibold text-slate-900">{template?.name || "this template"}</span>?
          </p>
          <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>
        </div>
      ),
      confirmText: "Delete Template",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    saveToServer(newTemplates);
  };

  const handleSaveEdit = () => {
    if (!editForm.name || !editForm.subject || !editForm.body) {
      alert("All fields are required.");
      return;
    }

    let newTemplates = [...templates];
    const existingIndex = newTemplates.findIndex(t => t.id === editForm.id);
    
    if (existingIndex >= 0) {
      newTemplates[existingIndex] = editForm as EmailTemplate;
    } else {
      newTemplates.push(editForm as EmailTemplate);
    }

    setTemplates(newTemplates);
    setEditingId(null);
    saveToServer(newTemplates);
  };

  const saveToServer = (templatesToSave: EmailTemplate[]) => {
    setStatus(null);
    startTransition(async () => {
      const result = await saveEmailTemplates(templatesToSave);
      setStatus(result);
      if (result.success) {
        setTimeout(() => setStatus(null), 3000);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-500" />
            Email Templates
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage automated emails sent to authors, reviewers, and editors.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={editingId !== null || isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      <div className="p-6">
        {status && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${status.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="space-y-4">
          {templates.length === 0 && editingId === null && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No templates configured yet.</p>
              <p className="text-sm text-slate-400 mt-1">Click "New Template" to create your first email template.</p>
            </div>
          )}

          {/* Edit Form */}
          {editingId && (
            <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-5 mb-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
                {templates.find(t => t.id === editingId) ? 'Edit Template' : 'New Template'}
              </h3>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Submission Received (Author)"
                  />
                  <p className="text-xs text-slate-500 mt-1">Internal name for this template.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Subject *</label>
                  <input
                    type="text"
                    value={editForm.subject || ""}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="e.g., [Journal Name] Submission Received"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Body *</label>
                  <textarea
                    value={editForm.body || ""}
                    onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-y"
                    placeholder="Dear {$authorName},&#10;&#10;Thank you for submitting your manuscript..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Use placeholders like <code className="bg-slate-200 px-1 rounded">{"{$authorName}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{$manuscriptTitle}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{$journalName}"}</code>.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          )}

          {/* List Templates */}
          <div className="grid grid-cols-1 gap-4">
            {templates.map(template => (
              <div key={template.id} className={`flex flex-col sm:flex-row sm:items-start justify-between p-5 border rounded-xl transition-all ${editingId === template.id ? 'hidden' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'}`}>
                <div className="flex-1 pr-4">
                  <h4 className="font-bold text-slate-900 text-base mb-1">{template.name}</h4>
                  <div className="text-sm text-slate-700 font-medium mb-2">Subj: {template.subject}</div>
                  <div className="text-sm text-slate-500 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3 whitespace-pre-wrap">
                    {template.body}
                  </div>
                </div>
                
                <div className="flex sm:flex-col space-x-3 sm:space-x-0 sm:space-y-2 mt-4 sm:mt-0 items-end shrink-0">
                  <button
                    onClick={() => handleEdit(template)}
                    disabled={editingId !== null || isPending}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Edit Template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={editingId !== null || isPending}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
