"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Camera, Mail } from "lucide-react";

export default function Footer() {
  const [year, setYear] = useState<number>(0);

  useEffect(() => {
    const id = setTimeout(() => setYear(new Date().getFullYear()), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <Camera size={20} />
          <span>Cutie Studio</span>
        </div>

        <p>
          Make every moment a little more magical.
          <Heart size={13} fill="currentColor" />
        </p>

        <div className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <a
            href="mailto:hello@cutiestudio.example"
            target="_blank"
            rel="noreferrer"
            aria-label="Contact"
          >
            <Mail size={17} />
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        © {year} Cutie Studio. Made with love ♡
      </div>
    </footer>
  );
}
