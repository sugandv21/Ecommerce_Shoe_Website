import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";


const STATIC_POSTS = [
  {
    id: "1",
    title: "How to choose the perfect trainers",
    excerpt:
      "Choosing the right trainers can transform comfort and performance. Learn about fit, cushioning and sole type.",
    content:
      "<p>Comfort, support and style are the key pillars when choosing trainers. Measure your feet in the evening, try with socks you'll wear, and walk for a few minutes. Consider arch support and the intended activity: running shoes differ from cross trainers.</p>",
    author: "StepUp Team",
    published_at: "2025-05-20",
    read_time: 4,
    tags: ["guides", "trainers"],
  },
  {
    id: "2",
    title: "Caring for your leather shoes",
    excerpt: "Leather shoes need a simple routine — cleaning, conditioning and buffing keeps them fresh.",
    content: "<p>Use a mild leather cleaner, apply conditioner, and buff with a soft cloth. Store with shoe trees to retain shape.</p>",
    author: "StepUp Team",
    published_at: "2025-04-10",
    read_time: 3,
    tags: ["care", "leather"],
  },
  {
    id: "3",
    title: "Sustainable materials: What to look for",
    excerpt: "Learn about low-impact materials, recycled soles and responsible production practices.",
    content: "<p>Sustainable shoes use recycled foam, plant-leather alternatives and responsible dyes. Look for certifications and brand transparency.</p>",
    author: "StepUp Research",
    published_at: "2025-03-02",
    read_time: 5,
    tags: ["sustainability"],
  },
  {
    id: "4",
    title: "Breaking in new shoes without pain",
    excerpt: "A few tricks to reduce blisters and speed up break-in time.",
    content: "<p>Wear thicker socks at home, use shoe stretchers, and treat friction zones with moleskin tape during the first wears.</p>",
    author: "Style Desk",
    published_at: "2025-02-05",
    read_time: 2,
    tags: ["tips"],
  },
  {
    id: "5",
    title: "Best casual sneaker pairings",
    excerpt: "How to style casual sneakers for weekend and smart-casual looks.",
    content: "<p>Pair white sneakers with cropped trousers or a linen shirt for a relaxed, clean look.</p>",
    author: "StepUp Style",
    published_at: "2025-01-15",
    read_time: 3,
    tags: ["style"],
  },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function TagPill({ tag, count, active, onClick }) {
  return (
    <button
      onClick={() => onClick(tag)}
      aria-pressed={Boolean(active)}
      className={`flex items-center gap-2 whitespace-nowrap select-none
        px-3 py-1 rounded-full text-sm font-medium transition-transform
        ${active ? "bg-gradient-to-r from-emerald-700 to-emerald-500 text-white shadow-lg" : "bg-white text-gray-700"}
        ${active ? "ring-2 ring-emerald-200" : "hover:shadow-sm hover:scale-[1.03]"}
        focus:outline-none focus:ring-2 focus:ring-emerald-300`}
    >
      <span className="truncate max-w-[8rem]">{tag}</span>
      <span
        className={`ml-1 inline-flex items-center justify-center text-xs font-semibold rounded-full px-2 py-0.5
          ${active ? "bg-white text-emerald-700" : "bg-gray-100 text-gray-600"}`}
        aria-hidden
      >
        {count}
      </span>
    </button>
  );
}

export default function Blog() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const perPage = 6; // show more on larger screens

  const tagCounts = useMemo(() => {
    const map = new Map();
    STATIC_POSTS.forEach((p) => {
      (p.tags || []).forEach((t) => {
        map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return map;
  }, []);

  const allTags = useMemo(() => Array.from(tagCounts.keys()).sort(), [tagCounts]);

  const filtered = useMemo(() => {
    let out = STATIC_POSTS;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (p) =>
          (p.title + " " + p.excerpt + " " + (p.tags || []).join(" ")).toLowerCase().includes(q)
      );
    }
    if (activeTag) {
      out = out.filter((p) => (p.tags || []).includes(activeTag));
    }
    return out;
  }, [query, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  function clearFilters() {
    setQuery("");
    setActiveTag(null);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900">StepUp.in Blog</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">Short, focused articles about shoes, care and style. Mobile-first and responsive.</p>
        </header>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <label htmlFor="blog-search" className="sr-only">Search posts</label>
              <input
                id="blog-search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search posts..."
                className="w-full sm:w-80 px-3 py-2 pl-10 rounded border bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-200"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="10" cy="10" r="4" stroke="#9CA3AF" strokeWidth="1.5" />
                  <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 border rounded bg-white hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {/* Tags: horizontally scrollable on xs, wrapping on md+ */}
          <div className="w-full sm:w-auto">
            <div className="overflow-x-auto md:overflow-visible py-1">
              <div className="flex gap-3 md:flex-wrap md:items-center">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => { setActiveTag(null); setPage(1); }}
                    aria-pressed={!activeTag}
                    className={`px-3 py-1 text-sm rounded-full font-semibold transition
                      ${!activeTag ? "bg-emerald-700 text-white shadow-lg" : "bg-white text-gray-700 border"}`}
                  >
                    All
                  </button>
                </div>

                {allTags.map((t) => (
                  <div key={t} className="flex-shrink-0">
                    <TagPill
                      tag={t}
                      count={tagCounts.get(t) ?? 0}
                      active={activeTag === t}
                      onClick={(tag) => {
                        setActiveTag((current) => (current === tag ? null : tag));
                        setPage(1);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Posts grid: 1 col mobile, 2 cols sm, 3 cols lg */}
        <main>
          {pageItems.length === 0 ? (
            <div className="p-6 bg-white rounded border text-center text-gray-600">No posts found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.map((p) => (
                <article key={p.id} className="bg-white border rounded-lg p-4 flex flex-col h-full">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{p.title}</h2>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(p.published_at)} • {p.read_time} min • {p.author}
                    </div>
                    <p className="mt-3 text-gray-700">{p.excerpt}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600 hidden sm:block">
                      {(p.tags || []).map(t => (
                        <span key={t} className="inline-block mr-2 text-xs text-gray-500">#{t}</span>
                      ))}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelected(p)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-emerald-700 text-white rounded hover:opacity-95 text-sm"
                      >
                        Read
                      </button>
                      <Link
                        to="/"
                        className="hidden sm:inline-block px-3 py-2 border rounded text-sm text-gray-700 bg-white"
                      >
                        Share
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((s) => Math.max(1, s - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm"
              >
                Prev
              </button>
              <div className="px-3 py-1 border rounded bg-white text-sm">{page} / {totalPages}</div>
              <button
                onClick={() => setPage((s) => Math.min(totalPages, s + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </main>

        {/* Modal: fullscreen on small, centered on md+ */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />

            <article className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-auto max-h-[90vh]">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold">{selected.title}</h2>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(selected.published_at)} • {selected.read_time} min • {selected.author}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="ml-4 text-gray-600">✕</button>
                </div>

                <div className="mt-4 prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: selected.content }} />

                <div className="mt-6 flex justify-end">
                  <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded bg-white">Close</button>
                </div>
              </div>
            </article>
          </div>
        )}

        <footer className="mt-10 text-center text-gray-500">
          <div>© {new Date().getFullYear()} StepUpShoe</div>
          <div className="mt-1"><Link to="/" className="text-emerald-700">Back to store</Link></div>
        </footer>
      </div>
    </div>
  );
}
