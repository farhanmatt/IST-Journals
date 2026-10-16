"use client";

import { useState, useTransition } from "react";
import { JournalSection, saveJournalSections } from "./actions";
import { Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2, Layers } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface SectionsClientProps {
  initialSections: JournalSection[];
}

export function SectionsClient({ initialSections }: SectionsClientProps) {
  const [sections, setSections] = useState<JournalSection[]>(initialSections);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const confirm = useConfirm();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<JournalSection>>({});

  const handleAddNew = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setEditingId(newId);
    setEditForm({
      id: newId,
      name: "",
      policy: "",
      peerReviewed: true,
      openAccess: true
    });
  };

  const handleEdit = (section: JournalSection) => {
    setEditingId(section.id);
    setEditForm({ ...section });
  };

  const handleDelete = async (id: string) => {
    const section = sections.find(s => s.id === id);
    const confirmed = await confirm({
      title: "Delete Journal Section",
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to delete <span className="font-semibold text-slate-900">{section?.name || "this section"}</span>?
          </p>
          <p className="text-xs text-red-600 font-medium">This section and its configuration will be permanently removed.</p>
        </div>
      ),
      confirmText: "Delete Section",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    const newSections = sections.filter(s => s.id !== id);
    setSections(newSections);
    saveToServer(newSections);
  };

  const handleSaveEdit = () => {
    if (!editForm.name) {
      alert("Section name is required");
      return;
    }

    let newSections = [...sections];
    const existingIndex = newSections.findIndex(s => s.id === editForm.id);
    
    if (existingIndex >= 0) {
      newSections[existingIndex] = editForm as JournalSection;
    } else {
      newSections.push(editForm as JournalSection);
    }

    setSections(newSections);
    setEditingId(null);
    saveToServer(newSections);
  };

  const saveToServer = (sectionsToSave: JournalSection[]) => {
    setStatus(null);
    startTransition(async () => {
      const result = await saveJournalSections(sectionsToSave);
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
            <Layers className="w-5 h-5 mr-2 text-indigo-500" />
            Journal Sections
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage manuscript sections, their policies, and peer-review requirements.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={editingId !== null || isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
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
          {sections.length === 0 && editingId === null && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No sections configured yet.</p>
              <p className="text-sm text-slate-400 mt-1">Click "Add Section" to create your first journal section.</p>
            </div>
          )}

          {/* Edit Form */}
          {editingId && (
            <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-5 mb-6">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
                {sections.find(s => s.id === editingId) ? 'Edit Section' : 'New Section'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Section Name *</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    placeholder="e.g., Original Research"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Section Policy</label>
                  <textarea
                    value={editForm.policy || ""}
                    onChange={(e) => setEditForm({ ...editForm, policy: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="Policy details, word limits, guidelines..."
                  />
                </div>
                <div className="col-span-1 flex items-center space-x-3 mt-2">
                  <input
                    type="checkbox"
                    id="peerReviewed"
                    checked={editForm.peerReviewed || false}
                    onChange={(e) => setEditForm({ ...editForm, peerReviewed: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="peerReviewed" className="text-sm font-medium text-slate-700">Requires Peer Review</label>
                </div>
                <div className="col-span-1 flex items-center space-x-3 mt-2">
                  <input
                    type="checkbox"
                    id="openAccess"
                    checked={editForm.openAccess || false}
                    onChange={(e) => setEditForm({ ...editForm, openAccess: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="openAccess" className="text-sm font-medium text-slate-700">Open Access</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-indigo-100">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* List Sections */}
          <div className="grid grid-cols-1 gap-4">
            {sections.map(section => (
              <div key={section.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-xl transition-all ${editingId === section.id ? 'hidden' : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'}`}>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{section.name}</h4>
                  {section.policy && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{section.policy}</p>}
                  <div className="flex space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${section.peerReviewed ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {section.peerReviewed ? 'Peer Reviewed' : 'Not Peer Reviewed'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${section.openAccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                      {section.openAccess ? 'Open Access' : 'Subscription'}
                    </span>
                  </div>
                </div>
                
                <div className="flex sm:flex-col space-x-3 sm:space-x-0 sm:space-y-2 mt-4 sm:mt-0 items-end">
                  <button
                    onClick={() => handleEdit(section)}
                    disabled={editingId !== null || isPending}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Edit Section"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    disabled={editingId !== null || isPending}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete Section"
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
