"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type StaffUser = { _id: string; fullName: string; email: string; role: string; department?: string };
type ArticleBlock = { id: string; kind: "heading" | "paragraph"; level: number; text: string };
type ChallengeSettings = {
  challengeSlug: string;
  title: string;
  challengeType: string;
  registrationStartsAt: string;
  registrationEndsAt: string;
  votingStartsAt: string;
  votingEndsAt: string;
  nextAnnouncement: string;
  prizeSummary: string;
};
type PollRecord = { _id: string; title: string; description: string; options: string[]; startsAt: string; endsAt: string; status: string; votes?: number };
type ShopCategory = { _id: string; name: string; slug: string; description: string; active: boolean };
type ShopProduct = { _id: string; name: string; slug: string; description: string; imageUrl: string; price: number; categorySlug: string; status: string };
type ShopOrder = { _id: string; orderNumber: string; customerName: string; email: string; phone: string; total: number; status: string; items: Array<{ name: string; quantity: number }> };

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
  super_admin: ["overview", "posts", "events", "opportunities", "jishindie", "users", "shop"],
  admin: ["overview", "posts", "events", "opportunities", "jishindie"],
  department_admin: ["overview", "users"],
  content_editor: ["overview", "posts", "opportunities"],
  communications: ["overview", "posts", "events"],
  event_manager: ["overview", "events"],
  hr_manager: ["overview", "opportunities"],
  election_manager: ["overview", "jishindie"],
  shop_manager: ["overview", "shop"],
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState("other");
  const [challengeSettings, setChallengeSettings] = useState<ChallengeSettings>({
    challengeSlug: "weekly-jishindie",
    title: "Weekly Jishindie Challenge",
    challengeType: "creative",
    registrationStartsAt: "",
    registrationEndsAt: "",
    votingStartsAt: "",
    votingEndsAt: "",
    nextAnnouncement: "",
    prizeSummary: "",
  });
  const [savedChallengeSettings, setSavedChallengeSettings] = useState<ChallengeSettings[]>([]);
  const [polls, setPolls] = useState<PollRecord[]>([]);
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [categoryEditingId, setCategoryEditingId] = useState("");
  const [productEditingId, setProductEditingId] = useState("");
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "", active: true });
  const [productForm, setProductForm] = useState({ name: "", slug: "", description: "", imageUrl: "", price: "", categorySlug: "", status: "draft" });
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
    const endpoint = value === "posts" ? "/api/admin/posts" : value === "events" ? "/api/admin/events" : value === "opportunities" ? "/api/admin/opportunities" : value === "users" ? "/api/admin/users" : value === "jishindie" ? "/api/admin/jishindie" : value === "shop" ? "/api/admin/shop" : "";
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
      setIsSuperAdmin(Boolean(data.isSuperAdmin));
      setCurrentDepartment(data.currentDepartment || "other");
    } else if (value === "shop") {
      setShopCategories(data.categories || []);
      setShopProducts(data.products || []);
      setShopOrders(data.orders || []);
    } else {
      setItems(data.posts || data.events || data.opportunities || data.entries || []);
    }
    if (value === "jishindie") {
      const [settingsResponse, pollsResponse, scheduleResponse] = await Promise.all([
        fetch("/api/admin/jishindie/settings"),
        fetch("/api/admin/jishindie/polls"),
        fetch("/api/jishindie/challenge?challenge=weekly-jishindie", { cache: "no-store" }),
      ]);
      const [settingsData, pollsData, scheduleData] = await Promise.all([
        settingsResponse.json().catch(() => ({})),
        pollsResponse.json().catch(() => ({})),
        scheduleResponse.json().catch(() => ({})),
      ]);
      if (!settingsResponse.ok || !pollsResponse.ok || !scheduleResponse.ok) {
        setNotice(settingsData.error || pollsData.error || "Could not load challenge schedule and polls.");
        return false;
      }
      const savedSettings = (settingsData.settings || []) as ChallengeSettings[];
      setSavedChallengeSettings(savedSettings);
      const selected = savedSettings.find((item) => item.challengeSlug === "weekly-jishindie");
      const fallback = scheduleData.schedule || {};
      const dateInput = (date: string | undefined) => date ? new Date(date).toISOString().slice(0, 16) : "";
      setChallengeSettings(selected ? {
        ...selected,
        registrationStartsAt: dateInput(selected.registrationStartsAt),
        registrationEndsAt: dateInput(selected.registrationEndsAt),
        votingStartsAt: dateInput(selected.votingStartsAt),
        votingEndsAt: dateInput(selected.votingEndsAt),
      } : {
        challengeSlug: "weekly-jishindie",
        title: "Weekly Jishindie Challenge",
        challengeType: "creative",
        registrationStartsAt: dateInput(fallback.registrationStartsAt),
        registrationEndsAt: dateInput(fallback.registrationEndsAt),
        votingStartsAt: dateInput(fallback.votingStartsAt),
        votingEndsAt: dateInput(fallback.votingEndsAt),
        nextAnnouncement: fallback.nextAnnouncement || "",
        prizeSummary: "",
      });
      setPolls(pollsData.polls || []);
    }
    return true;
  }

  useEffect(() => {
    fetch("/api/admin/session").then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setNotice(data.error || "Staff sign-in required."); return; }
      setStaff(data.user);
    });
  }, []);

  useEffect(() => {
    if (!staff) return;
    const timer = window.setTimeout(() => { void loadTab(tab); }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, staff]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const saved = await assignRole(String(body.email), String(body.role), String(body.department || currentDepartment));
    if (saved) form.reset();
  }

  async function updateJishindieEntry(entryId: string, status: string) {
    const response = await fetch("/api/admin/jishindie", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryId, status }) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? `Jishindie entry ${status}.` : data.error || "Entry update failed.");
    loadTab("jishindie");
  }

  async function saveChallengeSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const body = {
      ...fields,
      registrationStartsAt: new Date(String(fields.registrationStartsAt)).toISOString(),
      registrationEndsAt: new Date(String(fields.registrationEndsAt)).toISOString(),
      votingStartsAt: new Date(String(fields.votingStartsAt)).toISOString(),
      votingEndsAt: new Date(String(fields.votingEndsAt)).toISOString(),
    };
    const response = await fetch("/api/admin/jishindie/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Challenge schedule saved." : data.error || "Could not save schedule.");
    if (response.ok) await loadTab("jishindie");
  }

  async function selectChallengeSettings(challengeSlug: string, title: string, challengeType: string) {
    const saved = savedChallengeSettings.find((item) => item.challengeSlug === challengeSlug);
    if (saved) {
      const dateInput = (date: string) => new Date(date).toISOString().slice(0, 16);
      setChallengeSettings({
        ...saved,
        registrationStartsAt: dateInput(saved.registrationStartsAt),
        registrationEndsAt: dateInput(saved.registrationEndsAt),
        votingStartsAt: dateInput(saved.votingStartsAt),
        votingEndsAt: dateInput(saved.votingEndsAt),
      });
      return;
    }
    const response = await fetch(`/api/jishindie/challenge?challenge=${encodeURIComponent(challengeSlug)}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "Could not load challenge schedule.");
      return;
    }
    const dateInput = (date: string | undefined) => date ? new Date(date).toISOString().slice(0, 16) : "";
    setChallengeSettings({
      challengeSlug,
      title,
      challengeType,
      registrationStartsAt: dateInput(data.schedule?.registrationStartsAt),
      registrationEndsAt: dateInput(data.schedule?.registrationEndsAt),
      votingStartsAt: dateInput(data.schedule?.votingStartsAt),
      votingEndsAt: dateInput(data.schedule?.votingEndsAt),
      nextAnnouncement: data.schedule?.nextAnnouncement || "",
      prizeSummary: data.schedule?.prizeSummary || "",
    });
  }

  async function createPoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const body = {
      ...fields,
      options: String(fields.options || "").split("\n").map((option) => option.trim()).filter(Boolean),
      startsAt: new Date(String(fields.startsAt)).toISOString(),
      endsAt: new Date(String(fields.endsAt)).toISOString(),
    };
    const response = await fetch("/api/admin/jishindie/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Opinion poll created." : data.error || "Could not create poll.");
    if (response.ok) { form.reset(); await loadTab("jishindie"); }
  }

  async function deletePoll(id: string) {
    if (!window.confirm("Delete this poll and its votes?")) return;
    const response = await fetch(`/api/admin/jishindie/polls?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Poll deleted." : data.error || "Could not delete poll.");
    if (response.ok) await loadTab("jishindie");
  }

  async function saveShopCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/shop", {
      method: categoryEditingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...categoryForm, kind: "category", ...(categoryEditingId ? { id: categoryEditingId } : {}) }),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Shop category saved." : data.error || "Could not save category.");
    if (response.ok) {
      setCategoryEditingId("");
      setCategoryForm({ name: "", slug: "", description: "", active: true });
      await loadTab("shop");
    }
  }

  async function saveShopProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/shop", {
      method: productEditingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...productForm, price: Number(productForm.price), kind: "product", ...(productEditingId ? { id: productEditingId } : {}) }),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Shop product saved." : data.error || "Could not save product.");
    if (response.ok) {
      setProductEditingId("");
      setProductForm({ name: "", slug: "", description: "", imageUrl: "", price: "", categorySlug: "", status: "draft" });
      await loadTab("shop");
    }
  }

  async function deleteShopRecord(kind: "category" | "product", id: string) {
    if (!window.confirm(`Delete this shop ${kind}?`)) return;
    const response = await fetch(`/api/admin/shop?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? `${kind[0].toUpperCase()}${kind.slice(1)} deleted.` : data.error || `Could not delete ${kind}.`);
    if (response.ok) await loadTab("shop");
  }

  async function updateShopOrder(orderId: string, status: string) {
    const response = await fetch("/api/admin/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, kind: "order", status }),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Order status updated." : data.error || "Could not update order.");
    if (response.ok) await loadTab("shop");
  }

  async function changePollStatus(poll: PollRecord, status: string) {
    const response = await fetch("/api/admin/jishindie/polls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...poll, id: poll._id, status, startsAt: new Date(poll.startsAt).toISOString(), endsAt: new Date(poll.endsAt).toISOString() }),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? `Poll ${status}.` : data.error || "Could not update poll.");
    if (response.ok) await loadTab("jishindie");
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

  const visibleTabs = staff
    ? staff.role === "content_editor" && staff.department !== "creative"
      ? ["overview", "posts"]
      : staff.role === "communications" && staff.department === "creative"
        ? ["overview", "posts"]
        : staff.role === "department_admin"
      ? [
        "overview",
        "users",
        ...(staff.department === "creative" ? ["posts", "opportunities"] : []),
        ...(staff.department === "production" || staff.department === "events" ? ["events"] : []),
        ...(staff.department === "communications" ? ["posts", "events"] : []),
        ...(staff.department === "hr" ? ["opportunities"] : []),
        ...(staff.department === "elections" ? ["jishindie"] : []),
        ...(staff.department === "shop" ? ["shop"] : []),
      ]
      : roleTabs[staff.role] || ["overview"]
    : [];

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
      <aside className="admin-sidebar"><Link className="admin-brand" href="/">MW Studios</Link><nav>{visibleTabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "users" ? "Staff & roles" : item === "jishindie" ? "Jishindie & polls" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav><Link href="/">View website</Link></aside>
      <section className="admin-main"><header><div><span>MzimaWells workspace</span><h1>{staff.name}</h1></div><b>{formatStaffLabel(staff.role)}</b></header>{notice && <p className="admin-notice" role="status">{notice}</p>}
        {tab === "overview" && <div className="admin-overview">
          {visibleTabs.includes("posts") && <article><span>CONTENT</span><h2>Publish stories</h2><p>Create, edit, review and publish journal posts.</p><button onClick={() => setTab("posts")}>Manage posts →</button></article>}
          {visibleTabs.includes("events") && <article><span>EVENTS</span><h2>Create experiences</h2><p>Publish events for public registration and attendance.</p><button onClick={() => setTab("events")}>Manage events →</button></article>}
          {visibleTabs.includes("opportunities") && <article><span>PEOPLE</span><h2>Build the team</h2><p>Publish careers and manage job opportunities.</p><button onClick={() => setTab("opportunities")}>Manage opportunities →</button></article>}
          {visibleTabs.includes("jishindie") && <article><span>CHALLENGES</span><h2>Manage Jishindie</h2><p>Set challenge schedules, review contestants, and publish opinion polls.</p><button onClick={() => setTab("jishindie")}>Manage Jishindie →</button></article>}
          {["super_admin", "department_admin"].includes(staff.role) && <article><span>STAFF</span><h2>Delegate responsibilities</h2><p>{staff.role === "super_admin" ? "Assign staff roles across departments and appoint department admins." : `Manage eligible staff roles in ${formatStaffLabel(staff.department || "your department")}.`}</p><button onClick={() => setTab("users")}>Manage staff →</button></article>}
          {visibleTabs.includes("shop") && <article><span>MW SHOP</span><h2>Manage merchandise</h2><p>Update shop categories, products, and customer order statuses.</p><button onClick={() => setTab("shop")}>Manage shop →</button></article>}
          {visibleTabs.length === 1 && <article><span>WORKSPACE</span><h2>No tools assigned yet</h2><p>Contact the super administrator to request access to a management workspace.</p></article>}
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
        {tab === "jishindie" && <div className="admin-panel">
          <h2>Challenge schedule and format</h2>
          <form className="admin-form" onSubmit={saveChallengeSettings}>
            <label>Challenge<select value={challengeSettings.challengeSlug} onChange={(event) => {
              const option = event.target.selectedOptions[0];
              void selectChallengeSettings(event.target.value, option?.text || "Jishindie Challenge", option?.dataset.type || "creative");
            }}>
              <option value="weekly-jishindie" data-type="creative">Weekly Jishindie</option>
              <option value="tshirt-challenge" data-type="tshirt">T-shirt Challenge</option>
              <option value="seasonal-challenge" data-type="seasonal">End-of-Season Challenge</option>
              <option value="game-night-challenge" data-type="game_night">Game Night Challenge</option>
              <option value="kapsokwony-annual-run" data-type="custom">Kapsokwony Annual Run</option>
            </select></label>
            <label>Display title<input value={challengeSettings.title} onChange={(event) => setChallengeSettings((current) => ({ ...current, title: event.target.value }))} required maxLength={160} /></label>
            <label>Challenge format<select value={challengeSettings.challengeType} onChange={(event) => setChallengeSettings((current) => ({ ...current, challengeType: event.target.value }))}><option value="creative">Creator challenge</option><option value="tshirt">T-shirt challenge</option><option value="seasonal">End-of-season challenge</option><option value="game_night">Game night</option><option value="custom">Other</option></select></label>
            <label>Registration opens<input type="datetime-local" value={challengeSettings.registrationStartsAt} onChange={(event) => setChallengeSettings((current) => ({ ...current, registrationStartsAt: event.target.value }))} required /></label>
            <label>Registration closes<input type="datetime-local" value={challengeSettings.registrationEndsAt} onChange={(event) => setChallengeSettings((current) => ({ ...current, registrationEndsAt: event.target.value }))} required /></label>
            <label>Voting opens<input type="datetime-local" value={challengeSettings.votingStartsAt} onChange={(event) => setChallengeSettings((current) => ({ ...current, votingStartsAt: event.target.value }))} required /></label>
            <label>Voting closes<input type="datetime-local" value={challengeSettings.votingEndsAt} onChange={(event) => setChallengeSettings((current) => ({ ...current, votingEndsAt: event.target.value }))} required /></label>
            <label>Announcement<textarea value={challengeSettings.nextAnnouncement} onChange={(event) => setChallengeSettings((current) => ({ ...current, nextAnnouncement: event.target.value }))} maxLength={1000} rows={3} /></label>
            <label>Prize details<textarea value={challengeSettings.prizeSummary} onChange={(event) => setChallengeSettings((current) => ({ ...current, prizeSummary: event.target.value }))} maxLength={1000} rows={3} /></label>
            <button type="submit">Save challenge schedule</button>
          </form>
          <h2>Contestant registrations</h2>
          <div className="staff-table">{items.map((entry) => <div key={String(entry._id)}><p><b>{String(entry.stageName || entry.fullName)}</b><span>{String(entry.category)} · {String(entry.status)} · {String(entry.email || "")}</span></p><select value={String(entry.status)} onChange={(event) => updateJishindieEntry(String(entry._id), event.target.value)}><option value="registered">Registered</option><option value="review">Under review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>)}</div>
          <h2>Publish an opinion poll</h2>
          <form className="admin-form" onSubmit={createPoll}>
            <label>Poll question<input name="title" required maxLength={160} /></label>
            <label>Details<textarea name="description" rows={3} maxLength={1000} /></label>
            <label>Answer options (one per line)<textarea name="options" required rows={5} placeholder={"Option one\nOption two"} /></label>
            <label>Voting opens<input name="startsAt" type="datetime-local" required /></label>
            <label>Voting closes<input name="endsAt" type="datetime-local" required /></label>
            <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="active">Publish when dates begin</option></select></label>
            <button type="submit">Create poll</button>
          </form>
          <h3>Current polls</h3>
          <div className="admin-item-list">{polls.map((poll) => <div key={poll._id}><p><b>{poll.title}</b><span>{poll.status} · {poll.votes || 0} votes · {poll.options.join(" / ")}</span></p><div><button onClick={() => changePollStatus(poll, poll.status === "closed" ? "active" : "closed")}>{poll.status === "closed" ? "Reopen" : "Close poll"}</button><button className="danger-button" onClick={() => deletePoll(poll._id)}>Delete</button></div></div>)}</div>
        </div>}
        {tab === "shop" && <div className="admin-panel">
          <h2>{categoryEditingId ? "Edit shop category" : "Create a shop category"}</h2>
          <form className="admin-form" onSubmit={saveShopCategory}>
            <label>Category name<input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} required maxLength={100} /></label>
            <label>URL slug<input value={categoryForm.slug} onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") }))} required maxLength={120} /></label>
            <label>Description<textarea value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} maxLength={500} rows={3} /></label>
            <label>Visibility<select value={categoryForm.active ? "active" : "hidden"} onChange={(event) => setCategoryForm((current) => ({ ...current, active: event.target.value === "active" }))}><option value="active">Visible in the shop</option><option value="hidden">Hidden</option></select></label>
            <button type="submit">{categoryEditingId ? "Update category" : "Add category"}</button>
            {categoryEditingId && <button type="button" onClick={() => { setCategoryEditingId(""); setCategoryForm({ name: "", slug: "", description: "", active: true }); }}>Cancel</button>}
          </form>
          <div className="admin-item-list">{shopCategories.map((category) => <div key={category._id}><p><b>{category.name}</b><span>/{category.slug} · {category.active ? "Visible" : "Hidden"} · {category.description}</span></p><div><button onClick={() => { setCategoryEditingId(category._id); setCategoryForm({ name: category.name, slug: category.slug, description: category.description || "", active: category.active }); }}>Edit</button><button className="danger-button" onClick={() => deleteShopRecord("category", category._id)}>Delete</button></div></div>)}</div>
          <h2>{productEditingId ? "Edit product" : "Add merchandise"}</h2>
          <form className="admin-form" onSubmit={saveShopProduct}>
            <label>Product name<input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} required maxLength={160} /></label>
            <label>URL slug<input value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") }))} required maxLength={180} /></label>
            <label>Category<select value={productForm.categorySlug} onChange={(event) => setProductForm((current) => ({ ...current, categorySlug: event.target.value }))} required><option value="">Select category</option>{shopCategories.map((category) => <option key={category._id} value={category.slug}>{category.name}</option>)}</select></label>
            <label>Price (KSh)<input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} required /></label>
            <label>Image URL<input type="url" value={productForm.imageUrl} onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://…" /></label>
            <label>Description<textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} maxLength={2000} rows={4} /></label>
            <label>Listing status<select value={productForm.status} onChange={(event) => setProductForm((current) => ({ ...current, status: event.target.value }))}><option value="draft">Draft</option><option value="published">Published</option></select></label>
            <button type="submit" disabled={!shopCategories.length}>{productEditingId ? "Update product" : "Save product"}</button>
            {productEditingId && <button type="button" onClick={() => { setProductEditingId(""); setProductForm({ name: "", slug: "", description: "", imageUrl: "", price: "", categorySlug: "", status: "draft" }); }}>Cancel</button>}
          </form>
          <div className="admin-item-list">{shopProducts.map((product) => <div key={product._id}><p><b>{product.name}</b><span>{product.status} · {shopCategories.find((category) => category.slug === product.categorySlug)?.name || product.categorySlug} · KSh {Number(product.price).toLocaleString()}</span></p><div><button onClick={() => { setProductEditingId(product._id); setProductForm({ name: product.name, slug: product.slug, description: product.description || "", imageUrl: product.imageUrl || "", price: String(product.price), categorySlug: product.categorySlug, status: product.status }); }}>Edit</button><button className="danger-button" onClick={() => deleteShopRecord("product", product._id)}>Delete</button></div></div>)}</div>
          <h2>Customer orders</h2>
          <div className="admin-item-list">{shopOrders.map((order) => <div key={order._id}><p><b>{order.orderNumber} · {order.customerName}</b><span>{order.email} · {order.phone} · {order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")} · KSh {Number(order.total).toLocaleString()}</span></p><select value={order.status} onChange={(event) => updateShopOrder(order._id, event.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option></select></div>)}</div>
        </div>}
        {tab === "users" && ["super_admin", "department_admin"].includes(staff.role) && <div className="admin-panel">
          <h2>Delegate staff access</h2>
          <p>Assign an eligible role to an existing active account by email. The account owner must register before access can be granted.</p>
          {isSuperAdmin
            ? <p>The global Super Admin retains access across every department and is protected from role changes. Only this account can appoint department admins.</p>
            : <p>You can assign eligible roles only within {formatStaffLabel(currentDepartment)}. Department admins cannot appoint other department admins or change the global Super Admin.</p>}
          <p>Roles unlock only the matching sections available in this workspace.</p>
          <form className="admin-form admin-role-form" onSubmit={submitRoleAssignment}>
            <label>Account email<input name="email" type="email" placeholder="colleague@example.com" required /></label>
            <label>Staff role<select name="role" defaultValue={roles[0] || ""} required>{roles.map((role) => <option key={role} value={role}>{formatStaffLabel(role)}</option>)}</select></label>
            <label>Department<select name="department" value={currentDepartment} onChange={(event) => setCurrentDepartment(event.target.value)} required disabled={!isSuperAdmin}>{departments.map((department) => <option key={department} value={department}>{formatStaffLabel(department)}</option>)}</select></label>
            <button type="submit">Assign role</button>
          </form>
          <h3>{isSuperAdmin ? "Accounts and staff assignments" : `${formatStaffLabel(currentDepartment)} department`}</h3>
          <div className="staff-table">{users.map((user) => <div key={user._id}><p><b>{user.fullName}</b><span>{user.email} · {formatStaffLabel(user.department || "other")}</span></p><strong>{user.role === "super_admin" ? "Global Super Admin" : formatStaffLabel(user.role)}</strong></div>)}</div>
        </div>}
      </section>
    </main>
  );
}
