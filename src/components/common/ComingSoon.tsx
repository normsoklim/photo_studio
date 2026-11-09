import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  emoji: string;
}

export default function ComingSoon({
  title,
  description,
  emoji,
}: ComingSoonProps) {
  return (
    <main className="coming-soon">
      <div className="coming-soon-card">
        <span className="coming-soon-emoji">{emoji}</span>

        <span className="section-eyebrow">
          <Sparkles size={13} /> SOMETHING CUTE IS COMING
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

        <Link href="/" className="button-primary">
          <ArrowLeft size={17} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
