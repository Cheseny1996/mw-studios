"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type StaffUser = { _id: string; fullName: string; email: string; role: string; department?: string };
type ArticleBlock = { id: string; kind: "heading" | "paragraph"; level: number; text: string };

function createArticleBlock(kind: ArticleBlock["kind"], level = 2): ArticleBlock {
  return { id: crypto.randomUUID(), kind, level, text: "" };
}

function readArticleBlocks(metadata: unknown): ArticleBlock[] {
  if (!metadata || typeof metadata !== "object" || !("contentBlocks" in metadata)) return [createArticleBlock("paragraph")];
  const blocks = (metadata as { contentBlocks?: unknown }).contentBlocks;
  if (!Array.isArray(blocks)) return [createArticleBlock("paragraph")];
  const validBlocks = blocks.flatMap((block): ArticleBlock[] => {
    if (!block || typeof block !== "object") return [];
    const candidate = block as Partial<ArticleBlock>;
    if (!["heading", "paragraph"].includes(String(candidate.kind)) || typeof candidate.text !== "string") return [];
    return [{
      id: crypto.randomUUID(),
      kind: candidate.kind as ArticleBlock["kind"],
      level: Math.min(6, Math.max(1, Number(candidate.level) || 2)),
      text: candidate.text,
    }];
  });
  return validBlocks.length ? validBlocks : [createArticleBlock("paragraph")];
}

const roleTabs: Record<string, string[]> = {
  super_admin: ["overview", "posts", "events", "opportunities", "jishindie", "users"],
  admin: ["overview", "posts", "events", "opportunities", "jishindie"],
  content_editor: ["overview", "posts", "opportunities"],
  communications: ["overview", "posts", "events"],
  event_manager: ["overview", "events"],
  hr_manager: ["overview", "opportunities"],
  election_manager: ["overview", "jishindie"],
  shop_manager: ["overview"],
  finance_manager: ["overview"],
};

function formatStaffLabel(value: string) {
  return value.split("_").map((part) => part.toLowerCase() === "hr" ? "HR" : part[0].toUpperCase() + part.slice(1)).join(" ");
}

export default function AdminPage() {
  const [staff, setStaff] = useState<{ name: string; role: string; department?: string } | null>(null);
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState("");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [editingId, setEditingId] = useState("");
  const [articleBlocks, setArticleBlocks] = useState<ArticleBlock[]>([{ id: "initial-paragraph", kind: "paragraph", level: 2, text: "" }]);
  const [newHeadingLevel, setNewHeadingLevel] = useState(2);

  async function adminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(data.error || "Sign-in failed."); return; }
    window.location.reload();
  }

  async function loadTab(value = tab): Promise<boolean> {
    setNotice("");
    const endpoint = value === "posts" ? "/api/admin/posts" : value === "events" ? "/api/admin/events" : value === "opportunities" ? "/api/admin/opportunities" : value === "users" ? "/api/admin/users" : value === "jishindie" ? "/api/admin/jishindie" : "";
    if (!endpoint) return false;
    let response: Response;
    try {
      response = await fetch(endpoint);
    } catch {
      setNotice("Could not connect to the admin service.");
      return false;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "Could not load this section.");
      return false;
    }
    if (value === "users") {
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setDepartments(data.departments || []);
    }
    else setItems(data.posts || data.events || data.opportunities || data.entries || []);
    return true;
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
    const fields = Object.fromEntries(new FormData(form));
    const body = {
      ...fields,
      tags: String(fields.tags || "").split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean),
      contentBlocks: articleBlocks.map(({ kind, level, text }) => ({ kind, level, text: text.trim() })),
      body: articleBlocks.map((block) => block.text.trim()).filter(Boolean).join("\n\n"),
    };
    const status = String(fields.status || "draft");
    try {
      const response = await fetch("/api/admin/posts", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { ...body, id: editingId } : body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice(data.error || "Could not save post.");
        return;
      }
      setNotice(`Post ${status === "published" ? "published" : "saved"} successfully.`);
      form.reset();
      setArticleBlocks([createArticleBlock("paragraph")]);
      setEditingId("");
      await loadTab("posts");
    } catch {
      setNotice("Could not connect to the admin service. Please try again.");
    }
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

  async function assignRole(email: string, role: string, department: string) {
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role, department }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice(data.error || "Role update failed.");
        return false;
      }
      const refreshed = await loadTab("users");
      setNotice(refreshed
        ? `Assigned ${formatStaffLabel(role)} in ${formatStaffLabel(department)} to ${email}.`
        : `Role assigned to ${email}, but the staff list could not be refreshed. Reload the page.`);
      return response.ok;
    } catch {
      setNotice("Could not connect to the admin service. Please try again.");
      return false;
    }
  }

  async function submitRoleAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const saved = await assignRole(String(body.email), String(body.role), String(body.department));
    if (saved) form.reset();
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

  function editPost(item: Record<string, unknown>) {
    setEditingId(String(item._id || ""));
    setArticleBlocks(readArticleBlocks(item.metadata));
    window.requestAnimationFrame(() => {
      const form = document.querySelector<HTMLFormElement>(".post-editor-form");
      if (!form) return;
      const metadata = item.metadata && typeof item.metadata === "object"
        ? item.metadata as { seoTitle?: string; metaDescription?: string; tags?: string[] }
        : {};
      const values: Record<string, string> = {
        title: String(item.title || ""),
        slug: String(item.slug || ""),
        excerpt: String(item.excerpt || ""),
        status: String(item.status || "draft"),
        seoTitle: String(metadata.seoTitle || ""),
        metaDescription: String(metadata.metaDescription || ""),
        tags: Array.isArray(metadata.tags) ? metadata.tags.join(", ") : "",
      };
      Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.value = value;
      });
      form.scrollIntoView({ behavior: "smooth" });
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
      <aside className="admin-sidebar"><Link className="admin-brand" href="/">MW Studios</Link><nav>{(roleTabs[staff.role] || ["overview"]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "users" ? "Staff & roles" : item === "jishindie" ? "Jishindie entries" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav><Link href="/">View website</Link></aside>
      <section className="admin-main"><header><div><span>MzimaWells workspace</span><h1>{staff.name}</h1></div><b>{formatStaffLabel(staff.role)}</b></header>{notice && <p className="admin-notice" role="status">{notice}</p>}
        {tab === "overview" && <div className="admin-overview">
          {roleTabs[staff.role]?.includes("posts") && <article><span>CONTENT</span><h2>Publish stories</h2><p>Create, edit, review and publish journal posts.</p><button onClick={() => setTab("posts")}>Manage posts →</button></article>}
          {roleTabs[staff.role]?.includes("events") && <article><span>EVENTS</span><h2>Create experiences</h2><p>Publish events for public registration and attendance.</p><button onClick={() => setTab("events")}>Manage events →</button></article>}
          {roleTabs[staff.role]?.includes("opportunities") && <article><span>PEOPLE</span><h2>Build the team</h2><p>Publish careers and manage job opportunities.</p><button onClick={() => setTab("opportunities")}>Manage opportunities →</button></article>}
          {roleTabs[staff.role]?.includes("jishindie") && <article><span>CHALLENGES</span><h2>Review Jishindie entries</h2><p>Review and update contestant registration status.</p><button onClick={() => setTab("jishindie")}>Manage entries →</button></article>}
          {staff.role === "super_admin" && <article><span>STAFF</span><h2>Delegate responsibilities</h2><p>Assign staff roles and departments using registered email addresses.</p><button onClick={() => setTab("users")}>Manage staff →</button></article>}
          {roleTabs[staff.role]?.length === 1 && <article><span>WORKSPACE</span><h2>No tools assigned yet</h2><p>Contact the super administrator to request access to a management workspace.</p></article>}
        </div>}
        {tab === "posts" && <div className="admin-panel post-admin-panel">
          <div className="post-admin-heading"><div><span className="admin-eyebrow">JOURNAL PUBLISHING</span><h2>{editingId ? "Edit article" : "Write a new article"}</h2><p>Write a complete story, organize its headings, and prepare search metadata before publishing.</p></div></div>
          <form className="admin-form post-editor-form" onSubmit={savePost}>
            <section className="post-editor-section">
              <h3>Article details</h3>
              <label>Article title (page H1)<input name="title" placeholder="A clear, descriptive title" required maxLength={180} /></label>
              <label>URL slug<input name="slug" placeholder="Automatically created from the title if blank" maxLength={180} /></label>
              <label>Short introduction<textarea name="excerpt" placeholder="A useful summary shown on the journal and article page" rows={3} maxLength={320} /></label>
            </section>
            <section className="post-editor-section">
              <div className="post-section-heading"><div><h3>Article content</h3><p>Add as many paragraphs and headings as needed. The article title is the recommended H1; use H2–H6 to organize sections beneath it.</p></div>
                <div className="post-block-actions">
                  <button type="button" onClick={() => setArticleBlocks((blocks) => [...blocks, createArticleBlock("paragraph")])}>Add paragraph</button>
                  <label className="post-heading-add">Heading level<select aria-label="New heading level" value={newHeadingLevel} onChange={(event) => setNewHeadingLevel(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>H{level}</option>)}</select></label>
                  <button type="button" onClick={() => setArticleBlocks((blocks) => [...blocks, createArticleBlock("heading", newHeadingLevel)])}>Add heading</button>
                </div>
              </div>
              <div className="post-block-list">
                {articleBlocks.map((block, index) => (
                  <article className="post-content-block" key={block.id}>
                    <div className="post-content-block-heading">
                      <strong>{block.kind === "heading" ? `Heading H${block.level}` : "Paragraph"}</strong>
                      <button type="button" aria-label={`Delete ${block.kind} ${index + 1}`} onClick={() => setArticleBlocks((blocks) => blocks.filter((candidate) => candidate.id !== block.id))}>Delete block</button>
                    </div>
                    {block.kind === "heading" && <label>Heading level<select aria-label={`Heading level for block ${index + 1}`} value={block.level} onChange={(event) => setArticleBlocks((blocks) => blocks.map((candidate) => candidate.id === block.id ? { ...candidate, level: Number(event.target.value) } : candidate))}>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>Heading {level} (H{level})</option>)}</select></label>}
                    <label className="post-block-text">{block.kind === "heading" ? "Heading text" : "Paragraph text"}<textarea aria-label={`${block.kind === "heading" ? `Heading H${block.level}` : "Paragraph"} content ${index + 1}`} rows={block.kind === "heading" ? 2 : 5} placeholder={block.kind === "heading" ? "Write a section heading" : "Write a paragraph"} value={block.text} onChange={(event) => setArticleBlocks((blocks) => blocks.map((candidate) => candidate.id === block.id ? { ...candidate, text: event.target.value } : candidate))} /></label>
                  </article>
                ))}
              </div>
            </section>
            <section className="post-editor-section">
              <h3>Search engine preview (SEO)</h3>
              <p>These fields help search engines and social previews describe your article. They don’t guarantee rankings or indexing.</p>
              <label>SEO title<input name="seoTitle" placeholder="Optional; defaults to the article title" maxLength={180} /></label>
              <label>Meta description<textarea name="metaDescription" placeholder="A concise, accurate summary for search results (recommended: 150–160 characters)" rows={3} maxLength={320} /></label>
              <label>Tags<input name="tags" placeholder="Separate tags with commas, e.g. Kapsokwony, community, events" /></label>
            </section>
            <section className="post-editor-section post-publish-section">
              <label>Publication status<select name="status" defaultValue="draft"><option value="draft">Save as draft</option><option value="published">Publish article</option><option value="archived">Archive article</option></select></label>
              <div className="post-publish-actions"><button type="submit">{editingId ? "Save article changes" : "Save article"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); setArticleBlocks([createArticleBlock("paragraph")]); loadTab("posts"); }}>Cancel editing</button>}</div>
            </section>
          </form>
          <section className="post-list-section"><h3>Saved articles</h3><div className="admin-item-list">{items.map((item) => {
            const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata as { seoTitle?: string; tags?: string[] } : {};
            return <div key={String(item._id)}><p><b>{String(item.title)}</b><span>{String(item.status)}{metadata.seoTitle ? ` · SEO: ${metadata.seoTitle}` : ""}{Array.isArray(metadata.tags) && metadata.tags.length ? ` · ${metadata.tags.join(", ")}` : ""}</span></p><div><button onClick={() => editPost(item)}>Edit</button><button className="danger-button" onClick={() => deleteItem("posts", String(item._id))}>Delete</button></div></div>;
          })}</div></section>
        </div>}
        {tab === "events" && <div className="admin-panel"><h2>{editingId ? "Edit event" : "New event"}</h2><form className="admin-form" onSubmit={saveEvent}><input name="title" placeholder="Event title" required /><input name="slug" placeholder="Permalink slug (optional)" /><input name="date" type="datetime-local" required /><input name="time" placeholder="Time, e.g. 7:00 PM" /><input name="location" placeholder="Location" /><input name="capacity" type="number" min="0" placeholder="Capacity" /><textarea name="description" placeholder="Event description" rows={7} /><select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select><button>{editingId ? "Update event" : "Save / publish event"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); loadTab("events"); }}>Cancel editing</button>}</form><div className="admin-item-list">{items.map((item)=><div key={String(item._id)}><p><b>{String(item.title)}</b><span>{String(item.status)} · {String(item.location || "")}</span></p><div><button onClick={()=>editItem(item)}>Edit</button><button className="danger-button" onClick={()=>deleteItem("events",String(item._id))}>Delete</button></div></div>)}</div></div>}
        {tab === "opportunities" && <div className="admin-panel"><h2>{editingId ? "Edit career opportunity" : "New career opportunity"}</h2><form className="admin-form" onSubmit={saveOpportunity}><input name="title" placeholder="Job title" required /><input name="slug" placeholder="Permalink slug (optional)" /><select name="department"><option value="hr">HR</option><option value="creative">Creative</option><option value="production">Production</option><option value="communications">Communications</option><option value="events">Events</option><option value="technology">Technology</option><option value="other">Other</option></select><input name="location" placeholder="Location" /><input name="employmentType" placeholder="Employment type" /><input name="applicationEmail" type="email" placeholder="Application email" /><input name="applicationUrl" placeholder="Application URL (optional)" /><textarea name="summary" placeholder="Opportunity summary" rows={4} /><textarea name="description" placeholder="Role description" rows={5} /><textarea name="requirements" placeholder="Requirements" rows={5} /><select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select><button>{editingId ? "Update opportunity" : "Save / publish opportunity"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); loadTab("opportunities"); }}>Cancel editing</button>}</form><div className="admin-item-list">{items.map((item)=><div key={String(item._id)}><p><b>{String(item.title)}</b><span>{String(item.status)} · {String(item.location || "")}</span></p><div><button onClick={()=>editItem(item)}>Edit</button><button className="danger-button" onClick={()=>deleteItem("opportunities",String(item._id))}>Delete</button></div></div>)}</div></div>}
        {tab === "jishindie" && <div className="admin-panel"><h2>Jishindie registrations</h2><div className="staff-table">{items.map((entry) => <div key={String(entry._id)}><p><b>{String(entry.stageName || entry.fullName)}</b><span>{String(entry.category)} · {String(entry.status)} · {String(entry.email || "")}</span></p><select value={String(entry.status)} onChange={(event) => updateJishindieEntry(String(entry._id), event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>)}</div></div>}
        {tab === "users" && staff.role === "super_admin" && <div className="admin-panel">
          <h2>Delegate staff access</h2>
          <p>Assign a role and department to an existing active account by email. The account owner must register before you can grant access.</p>
          <p>Roles unlock only the matching sections available in this workspace; shop and finance management tools are not configured here yet.</p>
          <form className="admin-form admin-role-form" onSubmit={submitRoleAssignment}>
            <label>Account email<input name="email" type="email" placeholder="colleague@example.com" required /></label>
            <label>Staff role<select name="role" defaultValue="hr_manager" required>{roles.map((role) => <option key={role} value={role}>{formatStaffLabel(role)}</option>)}</select></label>
            <label>Department<select name="department" defaultValue="hr" required>{departments.map((department) => <option key={department} value={department}>{formatStaffLabel(department)}</option>)}</select></label>
            <button type="submit">Assign role</button>
          </form>
          <h3>Current staff assignments</h3>
          <div className="staff-table">{users.map((user) => <div key={user._id}><p><b>{user.fullName}</b><span>{user.email} · {formatStaffLabel(user.department || "other")}</span></p><strong>{formatStaffLabel(user.role)}</strong></div>)}</div>
        </div>}
      </section>
    </main>
  );
}
