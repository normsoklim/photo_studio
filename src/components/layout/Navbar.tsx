import Link from "next/link";
import {
  Camera,
  Film,
  Heart,
  Image,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";

const navigation = [
  { label: "Home", href: "/", icon: Heart },
  { label: "Camera", href: "/camera", icon: Camera },
  { label: "Photo Booth", href: "/photobooth", icon: Film },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Gallery", href: "/gallery", icon: Image },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Heart size={21} fill="currentColor" />
          </span>

          <span>
            Cutie<span className="brand-highlight">Studio</span>
            <small>YOUR LITTLE PHOTO WORLD</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.href}
                className="nav-link"
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/camera" className="nav-create-button">
          <Sparkles size={16} />
          Create Photo
        </Link>
      </div>
    </header>
  );
}
