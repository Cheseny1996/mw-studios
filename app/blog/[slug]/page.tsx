import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import { connectToDatabase } from "@/lib/db";
import { ContentModel } from "@/lib/models";

type ArticleBlock = {
  kind: "heading" | "paragraph";
  level: number;
  text: string;
};

type PublishedPost = {
  title: string;
  excerpt?: string;
  subtitle?: string;
  body?: string;
  slug?: string;
  publishedAt?: Date | string;
  metadata?: {
    seoTitle?: string;
    metaDescription?: string;
    tags?: string[];
    contentBlocks?: ArticleBlock[];
  };
};

const fallbackStories: Record<string, PublishedPost> = {
  "kapsokwony-annual-run-announced": { title: "Kapsokwony Annual Run Announced", excerpt: "The annual Kapsokwony Run is one of the region's famous community events.", body: "MzimaWells Studios highlights the Kapsokwony Annual Run, known through the community as the K-Run.\n\nThe event celebrates movement, community participation, and local culture through an annual sporting experience. Follow MzimaWells Studios for schedules, registration details, and announcements." },
  "jishindie-challenge-winners-announced": { title: "Jishindie Challenge Winners Announced", excerpt: "The community celebrates standout creative talent.", body: "The latest Jishindie Challenge season celebrated talented creators across music, dance, film, fashion, comedy, and digital content.\n\nCommunity voting played a central role in recognising finalists, fan favourites, and standout entries. Contestants received profiles, public vote totals, and a direct pathway into the competition experience.\n\nMzimaWells Studios congratulates every participant and looks forward to the next season of creativity and community." },
  "behind-the-scenes-latest-music-video-production": { title: "Behind the Scenes: Latest Music Video Production", excerpt: "See how an idea becomes a finished visual story.", body: "The newest MzimaWells music video production showcases the planning, filming, editing, and creative collaboration that happen behind the camera.\n\nFrom production design and rehearsal to cinematography, lighting, colour, and final sound, the team worked to deliver an authentic visual story. Every production combines artistic direction with a practical pipeline built to serve creators, artists, and audiences." },
  "community-outreach-program-success": { title: "Community Outreach Program Success", excerpt: "More than 500 young creatives reached through community action.", body: "MzimaWells Studios recently connected with more than 500 young creatives through community engagement activities designed to inspire participation in film, media, music, podcasting, and digital storytelling.\n\nThe programme created opportunities for young people to learn, share ideas, meet creative professionals, and discover practical pathways into the creative industry. Workshops, conversations, and hands-on experiences made creativity feel accessible and connected talent with real next steps." },
  "new-studio-equipment-upgrade": { title: "New Studio Equipment Upgrade", excerpt: "Expanded production capability for the next generation of stories.", body: "MzimaWells Studios has expanded its production capabilities with upgraded equipment for filming, editing, audio capture, lighting, and post-production.\n\nThe investment supports higher-quality music videos, podcasts, documentaries, live recordings, and other creative productions." },
  "upcoming-events-calendar-released": { title: "Upcoming Events Calendar Released", excerpt: "Explore the next live recordings, workshops and competitions.", body: "MzimaWells Studios has published its upcoming calendar of live recordings, workshops, community events, competitions, and creative programmes.\n\nVisitors can use the Events section to follow upcoming activities and complete account-based registration announcements." },
};

const getPublishedPost = cache(async (slug: string): Promise<PublishedPost | null> => {
  await connectToDatabase();
  return ContentModel.findOne({ type: "post", slug, status: "published" }).lean<PublishedPost>();
});

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const post = await getPublishedPost(slug) || fallbackStories[slug];
  if (!post) return { title: "Story not found | Mzima Wells Studios", robots: { index: false, follow: false } };

  const title = post.metadata?.seoTitle?.trim() || post.title;
  const description = post.metadata?.metaDescription?.trim() || post.excerpt || post.subtitle || "";
  const url = `/blog/${encodeURIComponent(slug)}`;
  const tags = post.metadata?.tags || [];

  return {
    title: { absolute: title },
    description,
    keywords: tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Mzima Wells Studios",
      ...(post.publishedAt ? { publishedTime: new Date(post.publishedAt).toISOString() } : {}),
      images: [{ url: "/mzima-wells-logo.png", alt: "Mzima Wells Studios" }],
    },
    twitter: { card: "summary", title, description },
  };
}

function renderArticleBlocks(post: PublishedPost) {
  const blocks = post.metadata?.contentBlocks?.filter((block) => block.text?.trim());
  if (blocks?.length) {
    return blocks.map((block, index) => {
      if (block.kind === "heading") {
        const level = Math.min(6, Math.max(1, Number(block.level) || 2));
        if (level === 1) return <h1 key={`block-${index}`}>{block.text}</h1>;
        if (level === 2) return <h2 key={`block-${index}`}>{block.text}</h2>;
        if (level === 3) return <h3 key={`block-${index}`}>{block.text}</h3>;
        if (level === 4) return <h4 key={`block-${index}`}>{block.text}</h4>;
        if (level === 5) return <h5 key={`block-${index}`}>{block.text}</h5>;
        return <h6 key={`block-${index}`}>{block.text}</h6>;
      }
      return <p key={`block-${index}`}>{block.text}</p>;
    });
  }
  return String(post.body || post.excerpt || "").split(/\n\n+/).filter(Boolean).map((paragraph, index) => <p key={`paragraph-${index}`}>{paragraph}</p>);
}

async function StoryContent({ params }: PageProps) {
  const { slug } = await params;
  await connection();
  const post = await getPublishedPost(slug) || fallbackStories[slug];

  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/blog">← All stories</Link></header>
      <article className="story-page">
        {!post ? <>
          <h1>Story not found</h1>
          <Link className="story-cta" href="/blog">Browse the journal</Link>
        </> : <>
          <Link className="story-back" href="/blog">Journal</Link>
          <h1>{post.title}</h1>
          <p className="story-deck">{post.excerpt || post.subtitle || post.metadata?.metaDescription}</p>
          <div className="story-cover" />
          <div className="story-body">{renderArticleBlocks(post)}</div>
          {post.metadata?.tags?.length ? <ul className="story-tags" aria-label="Article tags">{post.metadata.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
          <Link className="story-cta" href="/#news">Explore more from MzimaWells →</Link>
        </>}
      </article>
    </main>
  );
}

export default function StoryPage({ params }: PageProps) {
  return <Suspense fallback={<main className="inner-page"><p className="story-deck">Loading story...</p></main>}><StoryContent params={params} /></Suspense>;
}
