import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { connectToDatabase } from "@/lib/db";
import { ContentModel } from "@/lib/models";

type BlogPost = {
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt?: Date | string;
};

const fallbackPosts: BlogPost[] = [
  { slug: "kapsokwony-annual-run-announced", title: "Kapsokwony Annual Run Announced", publishedAt: "December 15, 2024", excerpt: "MzimaWells Studios highlights the famous annual Kapsokwony community run." },
  { slug: "jishindie-challenge-winners-announced", title: "Jishindie Challenge Winners Announced", publishedAt: "December 10, 2024", excerpt: "Community voting celebrates talented creators from across the competition categories." },
  { slug: "behind-the-scenes-latest-music-video-production", title: "Behind the Scenes: Latest Music Video Production", publishedAt: "December 5, 2024", excerpt: "A look inside the planning, filming, editing, and collaboration behind our latest production." },
  { slug: "community-outreach-program-success", title: "Community Outreach Program Success", publishedAt: "November 28, 2024", excerpt: "More than 500 young creatives joined outreach activities across film, media, music, and digital storytelling." },
];

export const metadata: Metadata = {
  title: "MzimaWells Journal | Stories, People and Creative Ideas",
  description: "Read articles, announcements and stories about African creativity, MzimaWells Studios, community events and Jishindie.",
  alternates: { canonical: "/blog" },
};

async function BlogContent() {
  await connection();
  await connectToDatabase();
  const posts = await ContentModel.find(
    { type: "post", status: "published" },
    { slug: 1, title: 1, excerpt: 1, publishedAt: 1 },
  ).sort({ publishedAt: -1 }).lean<BlogPost[]>();
  const displayedPosts = posts.length ? posts : fallbackPosts;

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

export default function BlogPage() {
  return <Suspense fallback={<main className="inner-page"><p className="story-deck">Loading the journal...</p></main>}><BlogContent /></Suspense>;
}
