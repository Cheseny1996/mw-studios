"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type StaffUser = { _id: string; fullName: string; email: string; role: string };

export default function AdminPage() {
  const [staff, setStaff] = useState<{ name: string; role: string } | null>(null);
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState("");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [editingId, setEditingId] = useState("");

  async function adminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(data.error || "Sign-in failed."); return; }
    window.location.reload();
  }

  async function loadTab(value = tab) {
    setNotice("");
    const endpoint = value === "posts" ? "/api/admin/posts" : value === "events" ? "/api/admin/events" : value === "opportunities" ? "/api/admin/opportunities" : value === "users" ? "/api/admin/users" : value === "jishindie" ? "/api/admin/jishindie" : "";
    if (!endpoint) return;
    const response = await fetch(endpoint);
    const data = await response.json().catch(() => ({}));
    if (value === "users") { setUsers(data.users || []); setRoles(data.roles || []); }
    else setItems(data.posts || data.events || data.opportunities || data.entries || []);
  }

  useEffect(() => {
    fetch("/api/admin/session").then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setNotice(data.error || "Staff sign-in required."); return; }
      setStaff(data.user);
    });
  }, []);

  useEffect(() => { if (staff) loadTab(tab); }, [tab, staff]); // eslint-disable-line react-hooks/exhaustive-deps

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/posts", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { ...body, id: editingId } : body) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? `Post ${body.status === "published" ? "published" : "saved"} successfully.` : data.error || "Could not save post.");
    if (response.ok) { form.reset(); setEditingId(""); }
    loadTab("posts");
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/events", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { ...body, id: editingId } : body) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Event saved successfully." : data.error || "Could not save event.");
    if (response.ok) { form.reset(); setEditingId(""); }
    loadTab("events");
  }

  async function saveOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/opportunities", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { ...body, id: editingId } : body) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Opportunity saved successfully." : data.error || "Could not save opportunity.");
    if (response.ok) { form.reset(); setEditingId(""); }
    loadTab("opportunities");
  }

  async function assignRole(userId: string, role: string) {
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role }) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Staff role updated." : data.error || "Role update failed.");
    loadTab("users");
  }

  async function updateJishindieEntry(entryId: string, status: string) {
    const response = await fetch("/api/admin/jishindie", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryId, status }) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? `Jishindie entry ${status}.` : data.error || "Entry update failed.");
    loadTab("jishindie");
  }

  async function deleteItem(type: "posts" | "events" | "opportunities", id: string) {
    if (!window.confirm(`Delete this ${type === "posts" ? "post" : type === "events" ? "event" : "opportunity"}?`)) return;
    const response = await fetch(`/api/admin/${type}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Item deleted successfully." : data.error || "Delete failed.");
    if (editingId === id) setEditingId("");
    loadTab(type);
  }

  function editItem(item: Record<string, unknown>) {
    setEditingId(String(item._id || ""));
    window.requestAnimationFrame(() => {
      const panel = document.querySelector(".admin-panel");
      if (!panel) return;
      Object.entries(item).forEach(([name, value]) => {
        const field = panel.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (!field || value == null) return;
        if (name === "date" && typeof value === "string") {
          const date = new Date(value);
          field.value = Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        } else {
          field.value = String(value);
        }
      });
      panel.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (!staff) return (
    <main className="admin-denied">
      <span>MW STAFF CONSOLE</span>
      <h1>Administrator sign in</h1>
      <p>{notice || "Use an approved staff account to manage the website."}</p>
      <form className="admin-login-form" onSubmit={adminLogin}>
        <input name="email" type="email" placeholder="Staff email" required />
        <input name="password" type="password" placeholder="Password" required minLength={12} />
        <button type="submit">Sign in to admin</button>
      </form>
      <Link href="/">← Return to website</Link>
    </main>
  );

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar"><Link className="admin-brand" href="/">MW Studios</Link><nav>{["overview", "posts", "events", "opportunities", "jishindie", "users"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "users" ? "Staff & roles" : item === "jishindie" ? "Jishindie entries" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav><Link href="/">View website</Link></aside>
      <section className="admin-main"><header><div><span>MzimaWells workspace</span><h1>{staff.name}</h1></div><b>{staff.role.replace("_", " ")}</b></header>{notice && <p className="admin-notice" role="status">{notice}</p>}
        {tab === "overview" && <div className="admin-overview"><article><span>CONTENT</span><h2>Publish stories</h2><p>Create, edit, review and publish journal posts.</p><button onClick={() => setTab("posts")}>Manage posts →</button></article><article><span>EVENTS</span><h2>Create experiences</h2><p>Publish events for public registration and attendance.</p><button onClick={() => setTab("events")}>Manage events →</button></article><article><span>PEOPLE</span><h2>Build the team</h2><p>Publish careers or assign staff roles by department.</p><button onClick={() => setTab("opportunities")}>Manage opportunities →</button></article></div>}
        {tab === "posts" && <div className="admin-panel"><h2>{editingId ? "Edit blog post" : "New blog post"}</h2><form className="admin-form" onSubmit={savePost}><input name="title" placeholder="Story title" required /><input name="slug" placeholder="Permalink slug (optional)" /><input name="excerpt" placeholder="Short summary" /><textarea name="body" placeholder="Full story body" rows={9} /><select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><button>{editingId ? "Update post" : "Save / publish post"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); loadTab("posts"); }}>Cancel editing</button>}</form><div className="admin-item-list">{items.map((item)=><div key={String(item._id)}><p><b>{String(item.title)}</b><span>{String(item.status)}</span></p><div><button onClick={()=>editItem(item)}>Edit</button><button className="danger-button" onClick={()=>deleteItem("posts",String(item._id))}>Delete</button></div></div>)}</div></div>}
        {tab === "events" && <div className="admin-panel"><h2>{editingId ? "Edit event" : "New event"}</h2><form className="admin-form" onSubmit={saveEvent}><input name="title" placeholder="Event title" required /><input name="slug" placeholder="Permalink slug (optional)" /><input name="date" type="datetime-local" required /><input name="time" placeholder="Time, e.g. 7:00 PM" /><input name="location" placeholder="Location" /><input name="capacity" type="number" min="0" placeholder="Capacity" /><textarea name="description" placeholder="Event description" rows={7} /><select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select><button>{editingId ? "Update event" : "Save / publish event"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); loadTab("events"); }}>Cancel editing</button>}</form><div className="admin-item-list">{items.map((item)=><div key={String(item._id)}><p><b>{String(item.title)}</b><span>{String(item.status)} · {String(item.location || "")}</span></p><div><button onClick={()=>editItem(item)}>Edit</button><button className="danger-button" onClick={()=>deleteItem("events",String(item._id))}>Delete</button></div></div>)}</div></div>}
        {tab === "opportunities" && <div className="admin-panel"><h2>{editingId ? "Edit career opportunity" : "New career opportunity"}</h2><form className="admin-form" onSubmit={saveOpportunity}><input name="title" placeholder="Job title" required /><input name="slug" placeholder="Permalink slug (optional)" /><select name="department"><option value="hr">HR</option><option value="creative">Creative</option><option value="production">Production</option><option value="communications">Communications</option><option value="events">Events</option><option value="technology">Technology</option><option value="other">Other</option></select><input name="location" placeholder="Location" /><input name="employmentType" placeholder="Employment type" /><input name="applicationEmail" type="email" placeholder="Application email" /><input name="applicationUrl" placeholder="Application URL (optional)" /><textarea name="summary" placeholder="Opportunity summary" rows={4} /><textarea name="description" placeholder="Role description" rows={5} /><textarea name="requirements" placeholder="Requirements" rows={5} /><select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select><button>{editingId ? "Update opportunity" : "Save / publish opportunity"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); loadTab("opportunities"); }}>Cancel editing</button>}</form><div className="admin-item-list">{items.map((item)=><div key={String(item._id)}><p><b>{String(item.title)}</b><span>{String(item.status)} · {String(item.location || "")}</span></p><div><button onClick={()=>editItem(item)}>Edit</button><button className="danger-button" onClick={()=>deleteItem("opportunities",String(item._id))}>Delete</button></div></div>)}</div></div>}
        {tab === "jishindie" && <div className="admin-panel"><h2>Jishindie registrations</h2><div className="staff-table">{items.map((entry) => <div key={String(entry._id)}><p><b>{String(entry.stageName || entry.fullName)}</b><span>{String(entry.category)} · {String(entry.status)} · {String(entry.email || "")}</span></p><select value={String(entry.status)} onChange={(event) => updateJishindieEntry(String(entry._id), event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>)}</div></div>}
        {tab === "users" && <div className="admin-panel"><h2>Staff access</h2><div className="staff-table">{users.map((user) => <div key={user._id}><p><b>{user.fullName}</b><span>{user.email}</span></p><select value={user.role} onChange={(event) => assignRole(user._id, event.target.value)}>{roles.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}</select></div>)}</div></div>}
      </section>
    </main>
  );
}
