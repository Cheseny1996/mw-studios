"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const fallback = [
  { slug: "video-editor", title: "Video Editor", department: "production", location: "Nairobi, Kenya", employmentType: "Full-time", summary: "Shape music videos, documentary films, and digital stories through precise editorial craft." },
  { slug: "creative-content-producer", title: "Creative Content Producer", department: "creative", location: "Nairobi, Kenya", employmentType: "Contract", summary: "Develop original concepts, coordinate productions, and turn ideas into memorable audience experiences." },
  { slug: "community-events-coordinator", title: "Community & Events Coordinator", department: "events", location: "Nairobi, Kenya", employmentType: "Full-time", summary: "Plan community programmes, creative events, registrations, and production schedules." },
];

export default function CareersPage() {
  const [opportunities, setOpportunities] = useState<Array<Record<string, string>>>(fallback);
  useEffect(() => {
    fetch("/api/public/opportunities").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.opportunities?.length) setOpportunities(data.opportunities);
    }).catch(() => undefined);
  }, []);
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand">MzimaWells Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero careers-hero"><span>BUILD WITH US</span><h1>Careers at MzimaWells</h1><p>Help tell stories that inspire, educate, and move communities forward.</p></section>
      <section className="careers-content"><div className="careers-intro"><span>OPEN OPPORTUNITIES</span><h2>Find your place in the story.</h2></div>
        <div className="opportunity-list">{opportunities.map((item) => (
          <article key={item.slug}><div><span>{item.department?.toUpperCase()}</span><h3>{item.title}</h3><p>{item.summary || item.description}</p></div><div className="opportunity-meta"><b>{item.location}</b><small>{item.employmentType}</small><Link href={`/careers/${item.slug}`}>View opportunity →</Link></div></article>
        ))}</div>
      </section>
    </main>
  );
}
