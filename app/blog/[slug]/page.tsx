"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const fallbackStories: Record<string, { title: string; excerpt: string; body: string }> = {
  "mzima-wells-studios-launches-new-podcast-series": { title: "MzimaWells Studios Launches New Podcast Series", excerpt: "K-Run Podcast begins a new chapter in African storytelling.", body: "MzimaWells Studios has launched a new K-Run Podcast series focused on African entertainment, culture, creativity, and the people shaping meaningful conversations.\n\nEach episode brings together artists, creators, producers, and community voices for practical discussions, personal stories, and fresh perspectives. New conversations explore creative entrepreneurship, digital media, production, and the power of community.\n\nThe series is designed for audiences who want thoughtful, accessible stories from Africa and its creative industries." },
  "jishindie-challenge-winners-announced": { title: "Jishindie Challenge Winners Announced", excerpt: "The community celebrates standout creative talent.", body: "The latest Jishindie Challenge season celebrated talented creators across music, dance, film, fashion, comedy, and digital content.\n\nCommunity voting played a central role in recognising finalists, fan favourites, and standout entries. Contestants received profiles, public vote totals, and a direct pathway into the competition experience.\n\nMzimaWells Studios congratulates every participant and looks forward to the next season of creativity and community." },
  "behind-the-scenes-latest-music-video-production": { title: "Behind the Scenes: Latest Music Video Production", excerpt: "See how an idea becomes a finished visual story.", body: "The newest MzimaWells music video production showcases the planning, filming, editing, and creative collaboration that happen behind the camera.\n\nFrom production design and rehearsal to cinematography, lighting, colour, and final sound, the team worked to deliver an authentic visual story. Every production combines artistic direction with a practical pipeline built to serve creators, artists, and audiences." },
  "community-outreach-program-success": { title: "Community Outreach Program Success", excerpt: "More than 500 young creatives reached through community action.", body: "MzimaWells Studios recently connected with more than 500 young creatives through community engagement activities designed to inspire participation in film, media, music, podcasting, and digital storytelling.\n\nThe programme created opportunities for young people to learn, share ideas, meet creative professionals, and discover practical pathways into the creative industry. Workshops, conversations, and hands-on experiences made creativity feel accessible and connected talent with real next steps." },
  "new-studio-equipment-upgrade": { title: "New Studio Equipment Upgrade", excerpt: "Expanded production capability for the next generation of stories.", body: "MzimaWells Studios has expanded its production capabilities with upgraded equipment for filming, editing, audio capture, lighting, and post-production.\n\nThe investment supports higher-quality music videos, podcasts, documentaries, live recordings, and other creative productions." },
  "upcoming-events-calendar-released": { title: "Upcoming Events Calendar Released", excerpt: "Explore the next live recordings, workshops and competitions.", body: "MzimaWells Studios has published its upcoming calendar of live recordings, workshops, community events, competitions, and creative programmes.\n\nVisitors can use the Events section to follow upcoming activities and complete account-based registration announcements." },
};

function StoryContent() {
  const { slug } = useParams<{ slug: string }>();
  const [livePost, setLivePost] = useState<{ title: string; excerpt?: string; subtitle?: string; body?: string; publishedAt?: Date | string } | null>(null);
  useEffect(() => {
    fetch(`/api/public/posts?slug=${encodeURIComponent(slug)}`).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.post) setLivePost(data.post);
    }).catch(() => undefined);
  }, [slug]);
  let post: { title: string; excerpt?: string; subtitle?: string; body?: string; publishedAt?: Date | string } | null = null;
  post = livePost;
  const fallback = fallbackStories[slug];
  if (!post && !fallback) return <main className="inner-page"><header className="inner-page-header"><Link href="/" className="inner-brand">MzimaWells Studios</Link><Link href="/blog">← All stories</Link></header><article className="story-page"><h1>Story not found</h1><Link className="story-cta" href="/blog">Browse the journal</Link></article></main>;
  const story = post || fallback;
  const paragraphs = String(post?.body || fallback?.body || story?.excerpt || "").split(/\n\n+/);

  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand">MzimaWells Studios</Link><Link href="/blog">← All stories</Link></header>
      <article className="story-page">
        <Link className="story-back" href="/blog">Journal</Link>
        <h1>{story.title}</h1>
        <p className="story-deck">{story.excerpt || (post?.subtitle ?? "")}</p>
        <div className="story-cover" />
        <div className="story-body">{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <Link className="story-cta" href="/#news">Explore more from MzimaWells →</Link>
      </article>
    </main>
  );
}

export default function StoryPage() {
  return <Suspense fallback={<main className="inner-page"><p className="story-deck">Loading story...</p></main>}><StoryContent /></Suspense>;
}
