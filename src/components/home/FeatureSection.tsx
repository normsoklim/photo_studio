import Link from "next/link";
import {
  Camera,
  Image,
  Palette,
  Heart,
  LayoutTemplate,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const features = [
  {
    title: "Cute Camera",
    description:
      "Take lovely pictures with your webcam or phone camera.",
    icon: Camera,
    color: "pink",
    href: "/camera",
    label: "Take photos",
  },
  {
    title: "Lovely Filters",
    description:
      "Give your pictures a dreamy, peachy or pink aesthetic.",
    icon: Palette,
    color: "purple",
    href: "/editor",
    label: "Explore filters",
  },
  {
    title: "Adorable Stickers",
    description:
      "Decorate your memories with hearts, bows and flowers.",
    icon: Heart,
    color: "peach",
    href: "/editor",
    label: "Add stickers",
  },
  {
    title: "Photo Templates",
    description:
      "Create beautiful photo strips with cute layouts.",
    icon: LayoutTemplate,
    color: "blue",
    href: "/templates",
    label: "View templates",
  },
  {
    title: "My Gallery",
    description:
      "Keep your favorite edited pictures in one place.",
    icon: Image,
    color: "green",
    href: "/gallery",
    label: "View gallery",
  },
  {
    title: "Creative Editing",
    description:
      "Customize brightness, colors, frames and text.",
    icon: Sparkles,
    color: "pink",
    href: "/editor",
    label: "Start editing",
  },
];

export default function FeatureSection() {
  return (
    <section className="features-section" id="features">
      <div className="section-heading">
        <span className="section-eyebrow">
          ♡ LITTLE THINGS YOU&rsquo;LL LOVE ♡
        </span>

        <h2>
          Everything you need to
          <span> make magic</span>
        </h2>

        <p>
          Your creativity deserves a cute little space.
        </p>
      </div>

      <div className="feature-grid">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Link
              href={feature.href}
              className="feature-card"
              key={feature.title}
            >
              <div className={`feature-icon ${feature.color}`}>
                <Icon size={25} />
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <span className="feature-action">
                {feature.label}
                <ArrowUpRight size={16} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
