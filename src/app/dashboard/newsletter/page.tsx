"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FilePlus2,
  Save,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  createDraft,
  deleteDraft,
  Draft,
  fetchDrafts,
  saveDraft,
  sendNewsletter,
} from "@/lib/api/newsletter";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const DRAFTS_KEY = "newsletter-draft-autosave";

export default function NewsletterPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New sending state
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const selected = useMemo(
    () => drafts.find((d) => d.draftId === selectedDraft?.draftId) ?? null,
    [drafts, selectedDraft?.draftId]
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const limit = 10;
        const resp = await fetchDrafts(page, limit);
        if (!mounted) return;
        setDrafts(resp.data);
        setTotal(resp.meta.total);
        setTotalPages(resp.meta.totalPages);

        if (resp.data.length > 0) {
          setSelectedDraft((prev) => {
            if (prev && resp.data.some((d) => d.draftId === prev.draftId)) return prev;
            return resp.data[0];
          });
        } else {
          setSelectedDraft(null);
        }
      } catch {
        const local = localStorage.getItem(DRAFTS_KEY);
        if (local) {
          try {
            const parsed: Draft = JSON.parse(local);
            if (!mounted) return;
            setDrafts([parsed]);
            setSelectedDraft({ ...parsed, updatedAt: new Date().toISOString() });
            setTotal(1);
            setTotalPages(1);
          } catch {
            // ignore parse error
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [page]);

  useEffect(() => {
    if (selectedDraft) {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(selectedDraft));
    }
  }, [selectedDraft]);

  const handleNew = useCallback(async () => {
    const id = `DR-${Math.floor(1000 + Math.random() * 9000)}`;
    const draft: Draft = {
      draftId: id,
      title: "Untitled Draft",
      content: "",
      updatedAt: new Date().toISOString(),
    };

    setDrafts((prev) => [draft, ...prev]);
    setSelectedDraft(draft);

    try {
      const created = await createDraft(draft);
      setDrafts((prev) =>
        prev.map((d) => (d.draftId === draft.draftId ? created : d))
      );
      setTotal((t) => t + 1);
      setTotalPages((tp) => Math.max(1, Math.ceil((total + 1) / 10)));
    } catch {
      // keep optimistic in UI; optionally show toast on failure
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const handleSave = useCallback(async () => {
    if (!selectedDraft) return;
    setDrafts((prev) =>
      prev.map((d) =>
        d.draftId === selectedDraft.draftId ? { ...selectedDraft, updatedAt: new Date().toISOString() } : d
      )
    );
    try {
      const saved = await saveDraft(selectedDraft);
      setDrafts((prev) => prev.map((d) => (d.draftId === saved.draftId ? saved : d)));
      localStorage.removeItem(DRAFTS_KEY);
      setSelectedDraft(saved);
    } catch {
      // optionally handle error
    }
  }, [selectedDraft]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDrafts((prev) => prev.filter((d) => d.draftId !== id));

      const wasSelected = id === selectedDraft?.draftId;

      if (wasSelected) {
        setSelectedDraft((prev) => {
          const next = drafts.find((d) => d.draftId !== id) || null;
          return next;
        });
      }

      try {
        await deleteDraft(id);
        const newTotal = Math.max(0, total - 1);
        setTotal(newTotal);
        const newTotalPages = newTotal === 0 ? 0 : Math.ceil(newTotal / 10);
        setTotalPages(newTotalPages);

        if (drafts.length <= 1 && page > 1) {
          setPage((p) => p - 1);
        }
      } catch {
        // On failure we might want to refetch to restore state. For simplicity, omitted here.
      }
    },
    [drafts, selectedDraft, page, total]
  );

  const handleSend = useCallback(async () => {
    if (!selectedDraft) return;
    setIsSending(true);
    setSendSuccess(false);
    setSendError(null);

    try {
      await sendNewsletter(selectedDraft);
      setSendSuccess(true);
      // clear autosave on success
      try {
        localStorage.removeItem(DRAFTS_KEY);
      } catch {
        // ignore
      }
      // hide success after a short delay
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      console.log(err);
      setSendError(err.response.data.message || err.message || "Failed to send newsletter. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [selectedDraft]);

  const goPrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const goNext = () => {
    if (totalPages === 0) return;
    if (page < totalPages) setPage((p) => p + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar */}
      <aside className="lg:col-span-1 rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold">Drafts</h2>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            disabled={isSending}
          >
            <FilePlus2 className="h-4 w-4" /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-slate-600">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="p-4 text-sm text-slate-600">No drafts found</div>
          ) : (
            <ul className="divide-y divide-slate-200 text-sm">
              {drafts.map((d) => (
                <li
                  key={d.draftId}
                  className={`flex items-center justify-between px-4 py-3 ${
                    d.draftId === selectedDraft?.draftId ? "bg-slate-50" : ""
                  }`}
                >
                  <button
                    onClick={() => setSelectedDraft(d)}
                    className="text-left"
                    disabled={isSending}
                  >
                    <div className="font-medium text-slate-900">{d.title}</div>
                    <div className="text-xs text-slate-600">
                      Updated {d.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(d.draftId)}
                    className="rounded-md p-1 hover:bg-slate-100"
                    disabled={isSending}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={page <= 1 || isSending}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>

            <div className="px-2">
              Page <span className="font-medium">{page}</span>
              {totalPages ? (
                <span className="text-slate-500"> of {totalPages}</span>
              ) : (
                <span className="text-slate-500"> • {drafts.length} items</span>
              )}
            </div>

            <button
              onClick={goNext}
              disabled={totalPages !== 0 ? page >= totalPages : drafts.length < 10 || isSending}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Editor */}
      <section className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Newsletter</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              disabled={isSending}
            >
              <Save className="h-4 w-4" /> Save
            </button>

            <div className="relative">
              <button
                onClick={handleSend}
                className={`inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-slate-800 ${isSending ? 'opacity-80 cursor-not-allowed' : ''}`}
                disabled={isSending || !selectedDraft}
              >
                <Send className={`h-4 w-4 ${isSending ? 'animate-spin' : ''}`} />
                {isSending ? 'Sending...' : 'Send'}
              </button>

              {/* success & error states */}
              <div className="absolute right-0 top-full mt-2">
                {sendSuccess && (
                  <div className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100">
                    <CheckCircle className="h-4 w-4" />
                    <span>Sent successfully</span>
                  </div>
                )}
                {sendError && (
                  <div className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-sm text-rose-600 bg-rose-50 border border-rose-100">
                    <AlertCircle className="h-4 w-4" />
                    <span>{sendError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <input
          value={selectedDraft?.title || ""}
          onChange={(e) =>
            setSelectedDraft((prev) =>
              prev ? { ...prev, title: e.target.value } : prev
            )
          }
          placeholder="Newsletter title"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />

        <div className="rounded-md border border-slate-300 overflow-hidden bg-white">
          <ReactQuill
            theme="snow"
            value={selectedDraft?.content || ""}
            onChange={(value) =>
              setSelectedDraft((prev) =>
                prev ? { ...prev, content: value } : prev
              )
            }
            placeholder="Write your newsletter..."
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ align: [] }],
                ["link"],
                ["clean"],
              ],
            }}
          />
        </div>

        {selected && (
          <div className="text-xs text-slate-600">Editing draft {selected.draftId}</div>
        )}
      </section>
    </div>
  );
}
