"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDraft, submitManuscript } from "./actions";
import { 
  CheckCircle2, Save, Send, ChevronRight, ChevronLeft, 
  FileText, UploadCloud, AlertCircle, Loader2, Sparkles, UserCheck, ShieldCheck 
} from "lucide-react";

type Section = {
  id: string;
  name: string;
};

export function SubmitWizard({ sections }: { sections: Section[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    abstract: "",
    keywords: "",
    sectionId: "",
    fileUrl: "",
    fileName: "",
    fileType: "",
  });

  const handleNext = async () => {
    setIsSaving(true);
    setError("");
    const res = await saveDraft(formData, step + 1);
    if (res.success && res.submissionId) {
      setFormData(prev => ({ ...prev, id: res.submissionId }));
      setStep(prev => prev + 1);
    } else {
      setError(res.error || "Failed to save draft");
    }
    setIsSaving(false);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError("");
    const res = await saveDraft(formData, step);
    if (res.success && res.submissionId) {
      setFormData(prev => ({ ...prev, id: res.submissionId }));
      alert("Draft saved successfully!");
      router.push("/author/drafts");
    } else {
      setError(res.error || "Failed to save draft");
    }
    setIsSaving(false);
  };

  const handleSubmit = async () => {
    if (!formData.id) return;
    setIsSaving(true);
    setError("");
    const res = await submitManuscript(formData.id);
    if (res.success) {
      router.push("/author/submissions?success=true");
    } else {
      setError(res.error || "Failed to submit manuscript");
    }
    setIsSaving(false);
  };

  const steps = [
    { num: 1, title: "Details", subtitle: "Title & Abstract" },
    { num: 2, title: "Authors", subtitle: "Affiliations" },
    { num: 3, title: "Files", subtitle: "Upload Document" },
    { num: 4, title: "Checklist", subtitle: "Declarations" },
    { num: 5, title: "Review", subtitle: "Final Submission" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Stepper Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between relative">
          {steps.map((s, i) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center relative z-10 flex-1">
                <div 
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                    isCompleted 
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" 
                      : isCurrent 
                      ? "bg-blue-600 text-white ring-4 ring-blue-500/15 shadow-sm shadow-blue-600/30 scale-105" 
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : s.num}
                </div>
                <span className={`text-xs mt-2.5 font-semibold text-center hidden sm:block ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                  {s.title}
                </span>
                <span className="text-[10px] text-slate-400 font-normal hidden md:block">
                  {s.subtitle}
                </span>

                {i < steps.length - 1 && (
                  <div 
                    className={`absolute top-5 sm:top-5.5 left-1/2 w-full h-[2px] -z-10 transition-colors duration-300 ${
                      step > s.num ? "bg-emerald-500" : "bg-slate-200"
                    }`} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Step Content Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 min-h-[420px]">
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manuscript Details</h2>
              <p className="text-xs text-slate-500 mt-1">Provide the foundational metadata and abstract for your submission.</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Journal Section *
                </label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  value={formData.sectionId}
                  onChange={e => setFormData({...formData, sectionId: e.target.value})}
                >
                  <option value="">Select a section...</option>
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Select the most relevant section category for your research.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Manuscript Title *
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter the complete title of your research manuscript"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Abstract *
                </label>
                <textarea 
                  rows={6}
                  className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none leading-relaxed"
                  value={formData.abstract}
                  onChange={e => setFormData({...formData, abstract: e.target.value})}
                  placeholder="Summarize the background, methodology, primary results, and key conclusions..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Keywords *
                </label>
                <input 
                  type="text" 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  value={formData.keywords}
                  onChange={e => setFormData({...formData, keywords: e.target.value})}
                  placeholder="e.g. quantum computing, entanglement, machine learning"
                />
                <p className="text-[11px] text-slate-500 mt-1">Separate individual keywords with commas.</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Authors & Affiliations</h2>
              <p className="text-xs text-slate-500 mt-1">Manage authorship roles and co-author records.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-8 rounded-2xl text-slate-800 border border-blue-100 flex flex-col items-center justify-center space-y-3.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Primary Corresponding Author</h3>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                You will be automatically registered as the corresponding author for this manuscript.
              </p>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 text-xs text-slate-700 max-w-md">
                Co-authors and institutional affiliations can also be added or revised from the manuscript details page after saving your draft.
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload Manuscript Document</h2>
              <p className="text-xs text-slate-500 mt-1">Upload the primary manuscript document file (.docx, .pdf, or archive).</p>
            </div>

            <div 
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-10 sm:p-12 flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer relative"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept="image/*,.pdf,.docx,.zip"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Validate size (50MB)
                  if (file.size > 50 * 1024 * 1024) {
                    setError("File size exceeds 50MB limit.");
                    return;
                  }
                  
                  // Validate type
                  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
                  if (!file.type.startsWith('image/') && !validTypes.includes(file.type)) {
                    setError("Invalid file type. Please upload a PDF, DOCX, ZIP, or Image.");
                    return;
                  }
                  
                  setError("");
                  setIsSaving(true);
                  
                  const uploadData = new FormData();
                  uploadData.append("file", file);
                  uploadData.append("submissionId", formData.id);
                  
                  try {
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      body: uploadData,
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                      setFormData(prev => ({ ...prev, fileUrl: data.url, fileName: file.name, fileType: file.type }));
                    } else {
                      setError(data.message || "Upload failed");
                    }
                  } catch (err) {
                    setError("An error occurred during upload.");
                  }
                  
                  setIsSaving(false);
                }}
              />
              
              {(formData as any).fileUrl ? (
                <div className="flex flex-col items-center text-center">
                  {(formData as any).fileType?.startsWith('image/') ? (
                    <img src={(formData as any).fileUrl} alt="Preview" className="max-h-36 mb-4 object-contain rounded-xl border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-sm">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                  <p className="font-bold text-slate-900 text-sm">{(formData as any).fileName}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> File ready for submission
                  </p>
                  <p className="text-xs text-blue-600 mt-3 font-semibold hover:underline">Click anywhere to replace file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">Click to choose a file or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-1">DOCX, PDF, or ZIP archive up to 50MB</p>
                  <span className="mt-3 px-3.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
                    Browse Computer
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Declarations & Checklist</h2>
              <p className="text-xs text-slate-500 mt-1">Please certify each statement before advancing to the final review step.</p>
            </div>

            <div className="space-y-3">
              {[
                "I confirm that this manuscript is original research and has not been published elsewhere.",
                "I confirm that all listed co-authors have approved the submitted manuscript version.",
                "I acknowledge adherence to the journal's publication ethics and malpractice guidelines.",
                "I have disclosed all potential conflicts of interest and relevant funding sources."
              ].map((text, i) => (
                <label 
                  key={i} 
                  className="flex items-start space-x-3.5 p-4 bg-slate-50/60 rounded-xl border border-slate-200 cursor-pointer hover:bg-blue-50/30 hover:border-blue-300 transition-all"
                >
                  <input 
                    type="checkbox" 
                    className="mt-0.5 w-4.5 h-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                    required 
                  />
                  <span className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">{text}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review & Final Submission</h2>
              <p className="text-xs text-slate-500 mt-1">Verify your submission details before forwarding to the editorial board.</p>
            </div>

            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manuscript Title</p>
                <p className="text-slate-900 font-bold text-base sm:text-lg mt-0.5">{formData.title || "Untitled"}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Section</p>
                  <p className="text-slate-800 font-medium text-sm mt-0.5">
                    {sections.find(s => s.id === formData.sectionId)?.name || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keywords</p>
                  <p className="text-slate-800 font-medium text-sm mt-0.5">{formData.keywords || "None"}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manuscript File</p>
                <p className="text-slate-800 font-medium text-sm mt-0.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{(formData as any).fileName || "No file uploaded"}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Abstract</p>
                <p className="text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed mt-1">
                  {formData.abstract || "No abstract provided"}
                </p>
              </div>
            </div>
            
            <div className="bg-amber-50/80 border border-amber-200/80 text-amber-900 p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-950 mb-0.5">Important Confirmation</p>
                <p>
                  Once submitted, this manuscript will be queued for editorial screening and peer review. You will be notified by email and on this dashboard whenever an editor updates your submission status.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save as Draft</span>
        </button>

        <div className="w-full sm:w-auto flex items-center space-x-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-xs disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          
          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving || (step === 1 && !formData.title)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/20 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-7 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-xs shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Manuscript</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
