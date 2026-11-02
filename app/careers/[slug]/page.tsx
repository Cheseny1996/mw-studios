"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function OpportunityContent() {
  const { slug } = useParams<{ slug: string }>();
  const [liveOpportunity, setLiveOpportunity] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    fetch(`/api/public/opportunities?slug=${encodeURIComponent(slug)}`).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.opportunity) setLiveOpportunity(data.opportunity);
    }).catch(() => undefined);
  }, [slug]);
  let opportunity: Record<string, string> | null = null;
  opportunity = liveOpportunity;
  if (!opportunity && !["video-editor", "creative-content-producer", "community-events-coordinator"].includes(slug)) return <main className="inner-page"><header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/careers">← All opportunities</Link></header><article className="opportunity-page"><h1>Opportunity not found</h1><Link className="apply-button" href="/careers">Browse careers</Link></article></main>;
  const titles: Record<string, string> = { "video-editor": "Video Editor", "creative-content-producer": "Creative Content Producer", "community-events-coordinator": "Community & Events Coordinator" };
  const title = opportunity?.title || titles[slug];
  const email = opportunity?.applicationEmail || "careers@mzimawellsstudios.com";
  const url = opportunity?.applicationUrl;
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/careers">← All opportunities</Link></header>
      <article className="opportunity-page"><span>CAREERS AT MZIMAWELLS</span><h1>{title}</h1><div className="opportunity-meta-detail"><b>{opportunity?.location || "Nairobi, Kenya"}</b><b>{opportunity?.employmentType || "Full-time"}</b></div>
        <section><h2>About the role</h2><p>{opportunity?.description || "Join the MzimaWells Studios team and contribute your talent to bold, meaningful creative work. This role collaborates across production, editorial, digital, and community teams."}</p></section>
        <section><h2>What we are looking for</h2><p>{opportunity?.requirements || "A strong portfolio or relevant experience, clear communication, dependable delivery, creative problem-solving, and a commitment to quality and teamwork."}</p></section>
        {url ? <a className="apply-button" href={url} target="_blank" rel="noreferrer">Apply for this role →</a> : <a className="apply-button" href={`mailto:${email}?subject=${encodeURIComponent(`Application: ${title}`)}`}>Apply for this role →</a>}
      </article>
    </main>
  );
}

export default function OpportunityPage() {
  return <Suspense fallback={<main className="inner-page"><p className="story-deck">Loading opportunity...</p></main>}><OpportunityContent /></Suspense>;
}
