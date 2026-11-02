import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero about-hero"><span>OUR STORY</span><h1>Changing the narrative<br/>through African stories.</h1></section>
      <section className="route-content">
        <div className="route-intro"><span>ABOUT US</span><h2>Creativity with purpose.</h2><p>MzimaWells Studios is a full-service creative content studio dedicated to telling authentic African stories through video, podcasting, music, digital media, and live experiences.</p></div>
        <div className="route-story-grid"><div className="route-image">MzimaWells</div><div><h3>Where we began</h3><p>MzimaWells Studios was born from a passion for authentic storytelling and a vision to amplify African voices. We have grown into a creative home for music videos, documentaries, podcasts, digital campaigns, and community-focused productions.</p><p>We work with artists, organisations, communities, and emerging talent to create work that informs, inspires, entertains, and lasts.</p></div></div>
        <div className="route-values">{[["01","Innovation","Fresh ideas and creative boundaries."],["02","Passion","Work driven by love for storytelling."],["03","Excellence","High standards in every delivery."],["04","Vision","Content that inspires future generations."]].map(([number,title,copy])=><article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        <Link className="route-cta" href="/team">Meet our team →</Link>
      </section>
    </main>
  );
}
