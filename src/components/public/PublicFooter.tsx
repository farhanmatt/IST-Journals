import Link from "next/link";
import { BookOpen, Mail, Phone, MapPin, ShieldCheck, ExternalLink } from "lucide-react";

interface PublicFooterProps {
  journalName: string;
  publisher: string;
  email: string;
  phone: string;
  issn?: string;
  address?: string;
}

export function PublicFooter({ 
  journalName, 
  publisher, 
  email, 
  phone,
  issn,
  address 
}: PublicFooterProps) {
  return (
    <footer id="contact" className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/#home" className="flex items-center space-x-3 text-white group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                {journalName}
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              An international, open-access, peer-reviewed journal dedicated to publishing cutting-edge research, reviews, and discoveries in advanced science and technology.
            </p>
            {issn && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 font-mono">
                <span className="text-blue-400 font-semibold">ISSN:</span> {issn}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
              Journal Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#home" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">About the Journal</Link>
              </li>
              <li>
                <Link href="/#current-issue" className="hover:text-white transition-colors">Current Issue</Link>
              </li>
              <li>
                <Link href="/#archives" className="hover:text-white transition-colors">Issues Archive</Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-white transition-colors">Published Articles</Link>
              </li>
              <li>
                <Link href="/#editorial-team" className="hover:text-white transition-colors">Editorial Team</Link>
              </li>
            </ul>
          </div>

          {/* Policies & Author Support */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
              Guidelines & Policies
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#guidelines" className="hover:text-white transition-colors">Author Guidelines</Link>
              </li>
              <li>
                <Link href="/#guidelines" className="hover:text-white transition-colors">Manuscript Preparation</Link>
              </li>
              <li>
                <Link href="/#policies" className="hover:text-white transition-colors">Peer Review Process</Link>
              </li>
              <li>
                <Link href="/#policies" className="hover:text-white transition-colors">Publication Ethics</Link>
              </li>
              <li>
                <Link href="/#policies" className="hover:text-white transition-colors">Plagiarism Screening</Link>
              </li>
              <li>
                <Link href="/#policies" className="hover:text-white transition-colors">Open Access & CC-BY</Link>
              </li>
            </ul>
          </div>

          {/* Publishing Office / Contact */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
              Publishing Office
            </h3>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Publisher</span>
                <span className="text-white font-medium text-sm mt-0.5 block">{publisher}</span>
              </li>
              <li>
                <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Contact Email</span>
                <a href={`mailto:${email}`} className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{email}</span>
                </a>
              </li>
              {phone && (
                <li>
                  <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Phone</span>
                  <span className="text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>{phone}</span>
                  </span>
                </li>
              )}
              <li>
                <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Location</span>
                <span className="text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>{address || "Academic Publishing Center"}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} {publisher}. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-700">&bull;</span>
            <p className="text-slate-400">Published under Creative Commons Attribution 4.0 International (CC BY 4.0)</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/#policies" className="hover:text-slate-300 transition-colors">Publication Ethics</Link>
            <Link href="/#policies" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/#policies" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
