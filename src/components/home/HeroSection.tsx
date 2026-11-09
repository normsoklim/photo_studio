import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Heart,
  Sparkles,
  Upload,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-decoration hero-decoration-one">♡</div>
      <div className="hero-decoration hero-decoration-two">✦</div>
      <div className="hero-decoration hero-decoration-three">୨୧</div>

      <div className="hero-content">
        <div className="hero-badge">
          <Sparkles size={15} />
          YOUR PERSONAL PHOTO PLAYGROUND
          <Heart size={13} fill="currentColor" />
        </div>

        <h1>
          Capture your
          <span> cutest moments!</span>
        </h1>

        <p className="hero-description">
          A little sparkle, a little pink, and a whole lot of you.
          Take photos, add adorable filters, and create memories
          worth keeping.
        </p>

        <div className="hero-actions">
          <Link href="/camera" className="button-primary">
            <Camera size={19} />
            Start Creating
            <ArrowRight size={17} />
          </Link>

          <Link href="#features" className="button-secondary">
            <Upload size={18} />
            Explore Features
          </Link>
        </div>

        <div className="hero-note">
          <Heart size={14} fill="currentColor" />
          Free to create · No account required
        </div>
      </div>

      <div className="hero-preview">
        <div className="preview-glow" />

        <div className="preview-card">
          <div className="preview-top">
            <div className="preview-dots">
              <span />
              <span />
              <span />
            </div>
            <span>MY CUTE PHOTO ♡</span>
          </div>

          <div className="preview-image">
            <div className="preview-placeholder">
              <Camera size={55} strokeWidth={1.4} />
              <span>Your lovely memories</span>
              <small>♡ Say cheese! ♡</small>
            </div>

            <span className="preview-heart heart-one">♥</span>
            <span className="preview-heart heart-two">✦</span>
            <span className="preview-heart heart-three">♡</span>
          </div>

          <div className="preview-bottom">
            <span>🎀 Cute Pink</span>
            <span>✨ Dreamy</span>
            <span>🌷 Soft</span>
          </div>
        </div>

        <div className="floating-tag floating-tag-one">
          🎀 So cute!
        </div>

        <div className="floating-tag floating-tag-two">
          ✨ Make memories
        </div>
      </div>
    </section>
  );
}
