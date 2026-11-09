import Link from "next/link";
import { Sparkles, Heart, ArrowRight, Camera, Image } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-header">
        <h1>About <span>Cutie Studio</span></h1>
        <p>A little creative space to make your everyday memories special.</p>
      </section>

      <div className="about-content">
        <section className="about-section">
          <h2>
            <Heart size={20} /> Our Story
          </h2>
          <p>
            Cutie Studio was born from a love of cute things and precious moments.
            We believe every photo tells a story, and every story deserves to be
            adorable. Whether you&rsquo;re capturing a day with friends, a family
            gathering, or just a quiet moment at home, we&rsquo;re here to help
            you make it magical.
          </p>
        </section>

        <section className="about-section">
          <h2>
            <Camera size={20} /> What We Offer
          </h2>
          <div className="about-feature-grid">
            <div className="about-feature-card">
              <div className="about-feature-icon">📸</div>
              <h3>Photo Booth</h3>
              <p>Capture six photos in classic strip layouts with cute frames and decorations.</p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">🎨</div>
              <h3>Photo Editor</h3>
              <p>Apply filters, frames, and adorable decorations to your favorite photos.</p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">💗</div>
              <h3>Gallery</h3>
              <p>Save and revisit your cherished photo memories anytime.</p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">🎀</div>
              <h3>Templates</h3>
              <p>Choose from beautiful photo strips and creative layouts.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>
            <Sparkles size={20} /> Our Aesthetic
          </h2>
          <p>
            Everything at Cutie Studio is designed with love&mdash;pastel colors,
            rounded corners, and adorable details that make your photos feel warm
            and whimsical. No backend, no accounts, just cute photos in your browser.
          </p>
        </section>
      </div>

      <section className="about-cta">
        <Link href="/" className="button-primary">
          <ArrowRight size={17} />
          Start Creating
        </Link>
      </section>
    </main>
  );
}
