"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { fetchCourses, createCourse, updateCourse, deleteCourse, uploadImage, Course } from "@/lib/api/courses";
import { CheckCircle, AlertCircle, Plus, X } from "lucide-react";

export default function CoursesUploadPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Course>>({
    title: "",
    description: "",
    instructor: "",
    duration: "",
    price: undefined,
    modules: undefined,
    image: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const resp: any = await fetchCourses(1, 100);
      // normalize
      let items: Course[] = [];
      if (Array.isArray(resp)) items = resp;
      else if (Array.isArray(resp.data)) items = resp.data;
      else if (Array.isArray(resp.items)) items = resp.items;
      setCourses(items || []);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  }

  const onChange = (k: keyof Course, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const onFileChange = async (f: File | null) => {
    if (!f) return;
    try {
      setIsSubmitting(true);
      const res: any = await uploadImage(f);
      if (res?.url) setForm((s) => ({ ...s, image: res.url }));
    } catch (err) {
      console.error('Upload failed', err);
      setMessage({ type: 'error', text: 'Image upload failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = () => {
    if (!form.title || !form.title.trim()) return "Title is required";
    if (!form.description || !form.description.trim()) return "Description is required";
    return null;
  };

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage(null);
    const v = validate();
    if (v) return setMessage({ type: 'error', text: v });

    setIsSubmitting(true);
    try {
      const payload: Course = {
        title: (form.title || "").trim(),
        description: (form.description || "").trim(),
        instructor: (form.instructor || "").trim(),
        duration: form.duration,
        price: form.price ? Number(form.price) : undefined,
        modules: form.modules ? Number(form.modules) : undefined,
        image: form.image || undefined,
      };

      if (editingId) {
        await updateCourse(editingId, payload);
        setMessage({ type: 'success', text: 'Course updated successfully' });
      } else {
        await createCourse(payload);
        setMessage({ type: 'success', text: 'Course created successfully' });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ title: '', description: '', instructor: '', duration: '', price: undefined, modules: undefined, image: '' });
      await loadCourses();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Failed to create course' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and create courses for your platform</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ title: '', description: '', instructor: '', duration: '', price: undefined, modules: undefined, image: '' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <div className="text-sm font-medium">{message.text}</div>
          </div>
        </div>
      )}

      {/* Courses Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">All Courses</h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-slate-600">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-600">No courses found. Click &quot;Add Course&quot; to create one.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Modules</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c._id || c.title} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {c.image && (
                          <Image src={c.image} alt={c.title} className="h-10 w-10 rounded object-cover" width={100} height={100} />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{c.title}</p>
                          {c.description && <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.instructor || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{c.duration || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{c.price ? `₦${Number(c.price).toLocaleString()}` : '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{c.modules ?? '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(c._id || null);
                            setForm({ title: c.title, description: c.description, instructor: c.instructor, duration: c.duration, price: c.price, modules: c.modules, image: c.image });
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this course?')) return;
                            try {
                              await deleteCourse(c._id || '');
                              setMessage({ type: 'success', text: 'Course deleted successfully' });
                              await loadCourses();
                            } catch (err: any) {
                              console.error(err);
                              setMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Failed to delete course' });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium border border-rose-300 text-rose-700 hover:bg-rose-50 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border border-slate-200 bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Course' : 'Add New Course'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in the course details below</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-md p-1 hover:bg-slate-100 text-slate-500 flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form - Scrollable */}
            <form id="course-form" onSubmit={handleCreate} className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Basic Information</div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Course Title *</label>
                  <input
                    value={form.title || ''}
                    onChange={(e) => onChange('title', e.target.value)}
                    placeholder="e.g., Web Development Fundamentals"
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                  <textarea
                    value={form.description || ''}
                    onChange={(e) => onChange('description', e.target.value)}
                    rows={5}
                    placeholder="Detailed course description..."
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Course Details Section */}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Course Details</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Instructor</label>
                    <input
                      value={form.instructor || ''}
                      onChange={(e) => onChange('instructor', e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                    <input
                      value={form.duration || ''}
                      onChange={(e) => onChange('duration', e.target.value)}
                      placeholder="e.g., 8 weeks"
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price (NGN)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">₦</span>
                      <input
                        value={form.price ?? ''}
                        onChange={(e) => onChange('price', e.target.value)}
                        type="number"
                        placeholder="0"
                        className="w-full pl-6 pr-3 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Number of Modules</label>
                    <input
                      value={form.modules ?? ''}
                      onChange={(e) => onChange('modules', e.target.value)}
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Course Image</div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {form.image && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-slate-600 mb-2">Preview</div>
                      <Image src={form.image} alt="Course preview" className="h-32 w-32 object-cover rounded-md border border-slate-200" width={128} height={128} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Upload Image</label>
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-slate-400 hover:bg-white transition-all">
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Click to upload image</div>
                        <div className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</div>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} disabled={isSubmitting} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setForm({ title: '', description: '', instructor: '', duration: '', price: undefined, modules: undefined, image: '' });
                  }}
                  className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
