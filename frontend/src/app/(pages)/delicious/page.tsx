"use client";

// DeliciousSocialUI.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Dados simulados
const users = [
  {
    username: "foodie77",
    bookmarks: [
      {
        title: "Chocolate Cake Recipe",
        url: "#",
        tags: ["recipes"],
        description: "Receita deliciosa de bolo de chocolate",
        public: true,
        likes: 3,
      },
      {
        title: "Perfect Sushi at Home",
        url: "#",
        tags: ["recipes", "food"],
        description: "Como fazer sushi perfeito em casa",
        public: false,
        likes: 1,
      },
    ],
    followers: ["techguru", "traveler21"],
    following: ["techguru", "traveler21"],
  },
  {
    username: "techguru",
    bookmarks: [
      {
        title: "Modern CSS Grid Layout",
        url: "#",
        tags: ["design", "css"],
        description: "Guia completo de CSS Grid",
        public: true,
        likes: 5,
      },
      {
        title: "Learn React in 2025",
        url: "#",
        tags: ["javascript", "react"],
        description: "Curso atualizado de React",
        public: true,
        likes: 2,
      },
    ],
    followers: ["foodie77"],
    following: ["foodie77"],
  },
  {
    username: "traveler21",
    bookmarks: [
      {
        title: "Top 10 Travel Destinations",
        url: "#",
        tags: ["travel"],
        description: "Melhores destinos para viajar em 2025",
        public: true,
        likes: 4,
      },
    ],
    followers: [],
    following: [],
  },
];

const sampleTags = [
  "recipes",
  "design",
  "travel",
  "css",
  "food",
  "books",
  "javascript",
  "react",
];
const suggestedUsers = ["chef89", "designerPro", "globetrotter"];

export default function DeliciousSocialUI() {
  const [currentUser, setCurrentUser] = useState(users[0]);
  const [feed, setFeed] = useState(users.flatMap((u) => u.bookmarks));
  const [likes, setLikes] = useState(feed.map((b) => b.likes));
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [profileTab, setProfileTab] = useState("public");

  // Feed infinito simulado
  useEffect(() => {
    const interval = setInterval(() => {
      const newBookmark = {
        title: `New Link #${Math.floor(Math.random() * 100)}`,
        url: "#",
        description: "Conteúdo recém-adicionado por outro usuário",
        tags: ["random"],
        public: true,
        likes: 0,
      };
      setFeed((prev) => [newBookmark, ...prev]);
      setLikes((prev) => [0, ...prev]);
      setNotifications((prev) => [
        `${newBookmark.title} adicionado!`,
        ...prev.slice(0, 4),
      ]);
    }, 10000); // novo link a cada 10s
    return () => clearInterval(interval);
  }, []);

  const toggleLike = (index) => {
    const newLikes = [...likes];
    newLikes[index]++;
    setLikes(newLikes);
  };

  const filteredFeed = feed.filter(
    (b) =>
      (!selectedTag || b.tags.includes(selectedTag)) &&
      b.title.toLowerCase().includes(search.toLowerCase())
  );

  const userPublicBookmarks = currentUser.bookmarks.filter((b) => b.public);
  const userPrivateBookmarks = currentUser.bookmarks.filter((b) => !b.public);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-800">Delicious Social</h1>
        <input
          type="text"
          placeholder="Pesquisar..."
          className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">
            {currentUser.username}
          </span>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 p-4">
        {/* Barra lateral */}
        <aside className="lg:w-1/4 bg-white p-4 rounded shadow space-y-6">
          <div>
            <h2 className="font-semibold mb-2">Tags Populares</h2>
            <div className="flex flex-wrap gap-2">
              {sampleTags.map((tag) => (
                <button
                  key={tag}
                  className={`px-3 py-1 rounded-full border ${
                    selectedTag === tag
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Usuários Sugeridos</h2>
            <ul className="space-y-1">
              {suggestedUsers.map((u) => (
                <li
                  key={u}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  + {u}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Notificações</h2>
            <ul className="text-sm space-y-1">
              {notifications.length === 0 ? (
                <li className="text-gray-400">Nenhuma notificação</li>
              ) : (
                notifications.map((n, i) => (
                  <li key={i} className="bg-gray-200 px-2 py-1 rounded">
                    {n}
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>

        {/* Feed e perfil */}
        <main className="flex-1 space-y-6">
          {/* Feed */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              {selectedTag ? `#${selectedTag}` : "Feed Público"}
            </h2>
            <AnimatePresence>
              {filteredFeed.map((b, i) => (
                <motion.div
                  key={b.title + i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white p-4 rounded shadow hover:shadow-lg mb-4"
                >
                  <a
                    href={b.url}
                    className="text-blue-600 font-medium text-lg hover:underline"
                  >
                    {b.title}
                  </a>
                  <p className="text-gray-600 mt-1 text-sm">{b.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {b.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-gray-200 px-2 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    className="mt-2 text-sm text-gray-700 hover:text-red-500 flex items-center gap-1"
                    onClick={() => toggleLike(i)}
                  >
                    ❤️ {likes[i]}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </section>

          {/* Perfil */}
          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">
              {currentUser.username}'s Perfil
            </h2>
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 rounded ${
                  profileTab === "public"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
                onClick={() => setProfileTab("public")}
              >
                Público
              </button>
              <button
                className={`px-3 py-1 rounded ${
                  profileTab === "private"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
                onClick={() => setProfileTab("private")}
              >
                Privado
              </button>
              <button
                className={`px-3 py-1 rounded ${
                  profileTab === "followers"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
                onClick={() => setProfileTab("followers")}
              >
                Seguidores
              </button>
              <button
                className={`px-3 py-1 rounded ${
                  profileTab === "following"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
                onClick={() => setProfileTab("following")}
              >
                Seguindo
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {profileTab === "public" &&
                userPublicBookmarks.map((b, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded shadow">
                    <a
                      href={b.url}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {b.title}
                    </a>
                    <p className="text-gray-600 text-sm mt-1">
                      {b.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {b.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-gray-200 px-2 py-0.5 rounded"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              {profileTab === "private" &&
                userPrivateBookmarks.map((b, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded shadow">
                    <a
                      href={b.url}
                      className="text-green-600 font-medium hover:underline"
                    >
                      {b.title}
                    </a>
                    <p className="text-gray-600 text-sm mt-1">
                      {b.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {b.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-gray-200 px-2 py-0.5 rounded"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              {profileTab === "followers" &&
                currentUser.followers.map((f, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded shadow">
                    {f}
                  </div>
                ))}
              {profileTab === "following" &&
                currentUser.following.map((f, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded shadow">
                    {f}
                  </div>
                ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
