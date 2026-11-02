import Link from "next/link";

const episodes = [
  ["The Future of African Entertainment","December 18, 2024","45:30"],
  ["Creative Entrepreneurship with Local Artists","December 11, 2024","38:15"],
  ["Behind the Mic: Producer Stories","December 4, 2024","52:20"],
  ["Youth and Digital Media","November 27, 2024","41:45"],
  ["The Power of Community in Content Creation","November 20, 2024","47:10"],
  ["From Studio to Screen: Film Production Insights","November 13, 2024","55:30"],
];

export default function PodcastPage() {
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand">MzimaWells Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero podcast-hero"><span>K-RUN PODCAST</span><h1>Conversations that inspire,<br/>educate and entertain.</h1></section>
      <section className="route-content"><div className="route-title"><span>EPISODES</span><h2>The latest conversations</h2></div><div className="episodes-list">{episodes.map(([title,date,duration],index)=><article key={title}><span className="episode-number">{String(index+1).padStart(2,"0")}</span><div><time>{date}</time><h3>{title}</h3></div><b>{duration}</b></article>)}</div></section>
    </main>
  );
}
