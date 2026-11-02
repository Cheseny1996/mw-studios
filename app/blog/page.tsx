"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const fallbackPosts = [
  ["mzima-wells-studios-launches-new-podcast-series", "MzimaWells Studios Launches New Podcast Series", "December 15, 2024", "A new K-Run Podcast series explores African entertainment, culture, creativity, and meaningful conversations."],
  ["jishindie-challenge-winners-announced", "Jishindie Challenge Winners Announced", "December 10, 2024", "Community voting celebrates talented creators from across the competition categories."],
  ["behind-the-scenes-latest-music-video-production", "Behind the Scenes: Latest Music Video Production", "December 5, 2024", "A look inside the planning, filming, editing, and collaboration behind our latest production."],
  ["community-outreach-program-success", "Community Outreach Program Success", "November 28, 2024", "More than 500 young creatives joined outreach activities across film, media, music, and digital storytelling."],
] as const;

export default function BlogPage() {
  const [posts, setPosts] = useState<Array<{ slug: string; title: string; excerpt?: string; publishedAt?: Date | string }>>([]);
  useEffect(() => {
    fetch("/api/public/posts").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.posts?.length) setPosts(data.posts);
    }).catch(() => undefined);
  }, []);
  const displayedPosts = posts.length ? posts : fallbackPosts.map(([slug, title, date, excerpt]) => ({ slug, title, excerpt, publishedAt: date }));

  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero blog-hero"><span>THE MW JOURNAL</span><h1>Ideas, people and stories<br/>shaping African creativity.</h1></section>
      <section className="blog-grid">
        {displayedPosts.map((post, index) => (
          <article className="blog-card" key={post.slug}>
            <Link className={`blog-cover blog-cover-${index % 4}`} href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}><span>MzimaWells</span></Link>
            <div><time>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Latest story"}</time><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link className="inline-action" href={`/blog/${post.slug}`}>Read full story →</Link></div>
          </article>
        ))}
      </section>
    </main>
  );
}
