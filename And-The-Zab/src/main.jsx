import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, createRoot } from "react-dom/client";
import {
  Search,
  Home,
  Compass,
  Library,
  Heart,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Radio,
  Clock3,
  PanelRight,
  Shuffle,
  Repeat2,
  Languages,
  X,
  Check,
  Music2,
  Menu,
  Palette,
  LogIn,
  LogOut,
} from "lucide-react";
import "./styles.css";
let audioUrl = "";
const art = (a) => `cover-art ${a}`;
const readJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: `Server error (${response.status}). Please try again.` };
  }
};
const albumTrack = (item) => ({
  id: item.id,
  youtubeId: item.audioUrl ? "" : item.id,
  title: item.title,
  artist: item.artist || "YouTube",
  album: "My album",
  duration: item.duration || "",
  art: "youtube",
  thumbnail: item.thumbnail || "",
  audioUrl: item.audioUrl || "",
});
const words = {
  en: {
    home: "Home",
    discover: "Discover",
    radio: "Radio",
    library: "Your Library",
    music: "YOUR MUSIC",
    favorites: "Favorites",
    playlists: "Playlists",
    create: "Create playlist",
    language: "Language",
    premium: "Premium member",
    recent: "Recently played",
    recentSub: "Pick up where you left off",
    popular: "Popular right now",
    popularSub: "What everyone's listening to",
    all: "All songs",
    see: "See all",
    search: "Search artists, songs, albums",
    empty: "No songs found",
    newList: "Create a playlist",
    newHint: "Give your new playlist a name.",
    name: "Playlist name",
    cancel: "Cancel",
    made: "Playlist created",
    radioTitle: "Sonora Radio",
    radioText: "Lean back and let the music play.",
    discoverTitle: "Discover something new",
    discoverText: "A curated selection for your next listen.",
    playAll: "Play all",
    playSelection: "Play selection",
    startRadio: "Start radio",
    upgrade: "Upgrade",
    title: "TITLE",
    album: "ALBUM",
    myAlbum: "My album",
    searchYoutube: "Search YouTube",
    moveTo: "Move to playlist",
    removeAlbum: "Remove from My album",
    signOut: "Sign out",
    addYoutube: "Add selected YouTube song",
    saved: "Song added to album",
    login: "Log in",
  },
  th: {
    home: "หน้าหลัก",
    discover: "ค้นหาเพลง",
    radio: "วิทยุ",
    library: "คลังเพลงของคุณ",
    music: "เพลงของคุณ",
    favorites: "เพลงโปรด",
    playlists: "เพลย์ลิสต์",
    create: "สร้างเพลย์ลิสต์",
    language: "ภาษา",
    premium: "สมาชิกพรีเมียม",
    recent: "เพลงที่เพิ่งเล่น",
    recentSub: "กลับมาฟังต่อจากครั้งล่าสุด",
    popular: "กำลังฮิตตอนนี้",
    popularSub: "เพลงที่ทุกคนกำลังฟัง",
    all: "เพลงทั้งหมด",
    see: "ดูทั้งหมด",
    search: "ค้นหาศิลปิน เพลง หรืออัลบั้ม",
    empty: "ไม่พบเพลง",
    newList: "สร้างเพลย์ลิสต์",
    newHint: "ตั้งชื่อเพลย์ลิสต์ใหม่ของคุณ",
    name: "ชื่อเพลย์ลิสต์",
    cancel: "ยกเลิก",
    made: "สร้างเพลย์ลิสต์แล้ว",
    radioTitle: "Sonora Radio",
    radioText: "ผ่อนคลายและปล่อยให้เสียงเพลงบรรเลง",
    discoverTitle: "พบกับเพลงใหม่",
    discoverText: "เพลงคัดสรรสำหรับการฟังครั้งต่อไปของคุณ",
    playAll: "เล่นทั้งหมด",
    playSelection: "เล่นรายการที่เลือก",
    startRadio: "เปิดวิทยุ",
    upgrade: "อัปเกรด",
    title: "ชื่อเพลง",
    album: "อัลบั้ม",
    myAlbum: "อัลบั้มของฉัน",
    searchYoutube: "ค้นหา YouTube",
    moveTo: "ย้ายไปเพลย์ลิสต์",
    removeAlbum: "ลบออกจากอัลบั้มของฉัน",
    signOut: "ออกจากระบบ",
    addYoutube: "เพิ่มเพลง YouTube ที่เลือก",
    saved: "เพิ่มเพลงเข้าอัลบั้มแล้ว",
    login: "เข้าสู่ระบบ",
  },
};
const tr = (key) =>
  words[localStorage.getItem("sonora-language") || "en"][key] || key;
const getDeletedIds = (key) => {
  try {
    const raw = localStorage.getItem(key) || "[]";
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
};
const saveDeletedId = (key, id) => {
  const ids = new Set(getDeletedIds(key));
  ids.add(String(id));
  localStorage.setItem(key, JSON.stringify([...ids]));
  return [...ids];
};
function App() {
  const [tracks, setTracks] = useState([]),
    [favorites, setFavorites] = useState([]),
    [current, setCurrent] = useState(0),
    [playing, setPlaying] = useState(false),
    [query, setQuery] = useState(""),
    [page, setPage] = useState("Home"),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [volume, setVolume] = useState(70),
    [language, setLanguage] = useState(
      () => localStorage.getItem("sonora-language") || "en",
    ),
    [lists, setLists] = useState(() => {
      try {
        const stored = localStorage.getItem("sonora-playlists");
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        const defaults = ["Summer nights", "Feel good songs", "On repeat", "Late night jazz"];
        if (
          Array.isArray(parsed) &&
          parsed.length === 4 &&
          parsed.every((name, idx) => name === defaults[idx])
        ) {
          localStorage.setItem("sonora-playlists", "[]");
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }),
    [modal, setModal] = useState(false),
    [listName, setListName] = useState(""),
    [toast, setToast] = useState(""),
    [shuffle, setShuffle] = useState(false),
    [repeat, setRepeat] = useState(false),
    [menu, setMenu] = useState(null),
    [youtubeVideo, setYoutubeVideo] = useState(null),
    [themeModal, setThemeModal] = useState(false),
    [mobileMenuOpen, setMobileMenuOpen] = useState(false),
    [currentUser, setCurrentUser] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("sonora-user") || "null");
      } catch {
        return null;
      }
    }),
    [theme, setTheme] = useState(
      () => localStorage.getItem("sonora-theme") || "classic",
    ),
    [motion, setMotion] = useState(
      () => localStorage.getItem("sonora-motion") !== "off",
    );
  const player = useRef(null),
    t = words[language];
  useEffect(() => {
    const handleAuth = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("sonora-user") || "null"));
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener("sonora-auth-changed", handleAuth);
    window.addEventListener("storage", handleAuth);
    return () => {
      window.removeEventListener("sonora-auth-changed", handleAuth);
      window.removeEventListener("storage", handleAuth);
    };
  }, []);
  useEffect(() => {
    Promise.all([
      fetch("/api/tracks").then((r) => r.json()),
      fetch("/api/favorites").then((r) => r.json()),
    ])
      .then(([a, b]) => {
        const deleted = getDeletedIds("sonora-deleted-tracks");
        setTracks(a.filter((track) => !deleted.includes(String(track.id))));
        setFavorites(b);
      })
      .catch(() => setToast("Could not load music library."));
  }, []);
  useEffect(() => {
    const loadAlbum = async () => {
      const token = localStorage.getItem("sonora-token");
      if (!token) return;
      try {
        const r = await fetch("/api/album", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          items = await readJson(r);
        if (!r.ok) return;
        const deletedAlbum = getDeletedIds("sonora-deleted-album");
        const filteredAlbum = items.filter(
          (item) => !deletedAlbum.includes(String(item.id)),
        );
        setTracks((current) => {
          const basic = current.filter(
              (track) =>
                !track.youtubeId &&
                !(track.audioUrl || String(track.id).startsWith("upload-")),
            ),
            youtube = filteredAlbum.map(albumTrack);
          return [...youtube, ...basic];
        });
      } catch {}
    };
    const openLibrary = () => setPage("Library");
    window.addEventListener("sonora-album-updated", loadAlbum);
    window.addEventListener("sonora-open-library", openLibrary);
    loadAlbum();
    return () => {
      window.removeEventListener("sonora-album-updated", loadAlbum);
      window.removeEventListener("sonora-open-library", openLibrary);
    };
  }, []);
  useEffect(
    () => localStorage.setItem("sonora-language", language),
    [language],
  );
  useEffect(
    () => localStorage.setItem("sonora-playlists", JSON.stringify(lists)),
    [lists],
  );
  useEffect(() => localStorage.setItem("sonora-theme", theme), [theme]);
  useEffect(
    () => localStorage.setItem("sonora-motion", motion ? "on" : "off"),
    [motion],
  );
  useEffect(() => {
    if (player.current) player.current.volume = volume / 100;
  }, [volume]);
  useEffect(() => {
    if (!player.current) return;
    playing
      ? player.current.play().catch(() => {
          setPlaying(false);
          setToast("Audio preview could not start.");
        })
      : player.current.pause();
  }, [playing, current]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 2600);
      return () => clearTimeout(id);
    }
  }, [toast]);
  const songs = useMemo(
      () =>
        tracks.filter((x) =>
          `${x.title} ${x.artist} ${x.album}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
      [tracks, query],
    ),
    shown =
      page === "Favorites"
        ? songs.filter((x) => favorites.includes(x.id))
        : songs,
    song = tracks[current] || tracks[0],
    fmt = (s) =>
      `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, "0")}`,
    select = (x) => {
      let i = tracks.findIndex((y) => y.id === x.id);
      if (i >= 0) {
        setCurrent(i);
        setTime(0);
        if (x.youtubeId) {
          setYoutubeVideo(x);
          setPlaying(false);
        } else {
          audioUrl = x.audioUrl || "";
          setPlaying(true);
        }
      }
    },
    change = (n) => {
      if (!tracks.length) return;
      setCurrent((i) =>
        shuffle
          ? Math.floor(Math.random() * tracks.length)
          : (i + n + tracks.length) % tracks.length,
      );
      setTime(0);
      setPlaying(true);
    },
    fav = async (id, e) => {
      e?.stopPropagation();
      let next = favorites.includes(id)
        ? favorites.filter((x) => x !== id)
        : [...favorites, id];
      setFavorites(next);
      try {
        let r = await fetch(`/api/favorites/${id}`, { method: "POST" });
        setFavorites((await r.json()).favorites);
      } catch {
        setToast("Favorite saved on this device only.");
      }
    },
    moveToList = (x, list) => {
      const saved = JSON.parse(
        localStorage.getItem("sonora-playlist-tracks") || "{}",
      );
      const existing = saved[list] || [];
      if (!existing.some((item) => String(item.id) === String(x.id))) {
        saved[list] = [...existing, x];
      }
      localStorage.setItem("sonora-playlist-tracks", JSON.stringify(saved));
      setMenu(null);
      setToast(`Moved to ${list}`);
    },
    removeAlbum = async (x) => {
      try {
        const isAlbumSong =
          Boolean(x.youtubeId) ||
          Boolean(x.audioUrl) ||
          String(x.id).startsWith("upload-");
        if (isAlbumSong) {
          const token = localStorage.getItem("sonora-token");
          if (!token) throw Error("Login required");
          const r = await fetch(
            `/api/album/${encodeURIComponent(String(x.id))}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
          );
          if (!r.ok) throw Error();
          saveDeletedId("sonora-deleted-album", x.id);
          window.dispatchEvent(new Event("sonora-album-updated"));
        } else {
          saveDeletedId("sonora-deleted-tracks", x.id);
        }
        setTracks((all) =>
          all.filter((item) => String(item.id) !== String(x.id)),
        );
        setMenu(null);
        setToast(
          isAlbumSong ? "Removed from My album." : "Song removed from library.",
        );
      } catch {
        setToast("Could not remove this song.");
      }
    },
    playAll = () => shown.length && select(shown[0]),
    deleteList = (list) => {
      const next = lists.filter((x) => x !== list);
      const saved = JSON.parse(
        localStorage.getItem("sonora-playlist-tracks") || "{}",
      );
      if (saved[list]) delete saved[list];
      localStorage.setItem("sonora-playlist-tracks", JSON.stringify(saved));
      setLists(next);
      setToast(`${list} removed.`);
    },
    create = (e) => {
      e.preventDefault();
      if (!listName.trim()) return;
      setLists((x) => [...x, listName.trim()]);
      setToast(`${t.made}: ${listName.trim()}`);
      setListName("");
      setModal(false);
    };
  const songList = () => (
    <>
      <section className="song-list">
        <div className="song-header">
          <span>#</span>
          <span>{t.title}</span>
          <span>{t.album}</span>
          <Clock3 size={15} />
        </div>
        {shown.map((x, i) => (
          <div
            className={"song-row " + (song?.id === x.id ? "selected" : "")}
            key={x.id}
            onClick={() => select(x)}
          >
            <span className="number">
              {song?.id === x.id && playing ? (
                <i className="bars">▮▮▮</i>
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div className={art(x.art)}>
              {x.thumbnail ? (
                <img src={x.thumbnail} alt="" />
              ) : (
                <span>{x.title[0]}</span>
              )}
            </div>
            <div className="song-title">
              <strong>{x.title}</strong>
              <small>{x.artist}</small>
            </div>
            <span className="album-name">
              {x.youtubeId ? t.myAlbum : x.album}
            </span>
            <button
              className={
                favorites.includes(x.id) ? "row-heart liked" : "row-heart"
              }
              onClick={(e) => fav(x.id, e)}
            >
              <Heart
                size={16}
                fill={favorites.includes(x.id) ? "currentColor" : "none"}
              />
            </button>
            <span>{x.duration}</span>
            <div className="song-actions">
              <button
                className="more-button"
                aria-label="Song actions"
                onClick={(e) => {
                  e.stopPropagation();
                  if (String(menu?.id) === String(x.id)) {
                    setMenu(null);
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const menuHeight = 50 + lists.length * 37;
                  const top =
                    rect.bottom + 8 + menuHeight > window.innerHeight - 8
                      ? Math.max(8, rect.top - menuHeight - 8)
                      : rect.bottom + 8;
                  setMenu({
                    id: String(x.id),
                    top,
                    left: Math.min(
                      Math.max(8, rect.right - 190),
                      window.innerWidth - 198,
                    ),
                  });
                }}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        ))}
        {!shown.length && (
          <div className="empty-state">
            <Music2 size={28} />
            {t.empty}
          </div>
        )}
      </section>
      {youtubeVideo && (
        <div className="youtube-playback">
          <div>
            <button onClick={() => setYoutubeVideo(null)}>
              <X size={18} />
            </button>
            <iframe
              title={youtubeVideo.title}
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideo.youtubeId}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
  const cards = (items = songs) => (
    <section className="track-grid">
      {items.map((x) => (
        <article className="album-card" key={x.id} onClick={() => select(x)}>
          <div className={art(x.art)}>
            <span className="cover-letter">{x.title[0]}</span>
            <button className="card-play">
              <Play size={17} fill="currentColor" />
            </button>
          </div>
          <h3>{x.title}</h3>
          <p>{x.artist}</p>
          <button
            className={favorites.includes(x.id) ? "heart liked" : "heart"}
            onClick={(e) => fav(x.id, e)}
          >
            <Heart
              size={17}
              fill={favorites.includes(x.id) ? "currentColor" : "none"}
            />
          </button>
        </article>
      ))}
    </section>
  );
  const main = () => {
    if (page === "Discover")
      return (
        <>
          <section className="page-intro">
            <p>{t.discoverText}</p>
            <h1>{t.discoverTitle}</h1>
            <button className="hero-play" onClick={playAll}>
              <Play size={18} fill="currentColor" />
              Play selection
            </button>
          </section>
          {cards()}
        </>
      );
    if (page === "Radio")
      return (
        <section className="radio-page">
          <div className="radio-disc">♫</div>
          <p>LIVE STATION</p>
          <h1>{t.radioTitle}</h1>
          <span>{t.radioText}</span>
          <button className="hero-play" onClick={playAll}>
            <Play size={18} fill="currentColor" />
            Start radio
          </button>
        </section>
      );
    if (["Library", "Favorites", "Playlists"].includes(page))
      return (
        <>
          <section className="library-title">
            <div>
              <p>
                {page === "Favorites"
                  ? t.favorites
                  : page === "Playlists"
                    ? t.playlists
                    : t.library}
              </p>
              <h1>{page === "Favorites" ? t.favorites : t.all}</h1>
            </div>
            <button className="hero-play" onClick={playAll}>
              <Play size={18} fill="currentColor" />
              Play all
            </button>
          </section>
          {songList()}
        </>
      );
    return (
      <>
        <section className="hero">
          <div className="hero-copy">
            <p>YOUR DAILY MIX</p>
            <h1>
              Made for your
              <br />
              <em>mood.</em>
            </h1>
            <span>A fresh selection of sounds you'll love.</span>
            <button className="hero-play" onClick={playAll}>
              <Play size={18} fill="currentColor" />
              Play all
            </button>
          </div>
          <div className="hero-visual">
            <div className="sun" />
            <div className="circle-line one" />
            <div className="circle-line two" />
            <div className="circle-line three" />
            <div className="orb orb-one" />
            <div className="orb orb-two" />
          </div>
        </section>
        <section className="section-head">
          <div>
            <h2>{t.recent}</h2>
            <p>{t.recentSub}</p>
          </div>
          <button onClick={() => setPage("Library")}>{t.see}</button>
        </section>
        {cards(songs.slice(0, 4))}
        <section className="section-head songs-heading">
          <div>
            <h2>{t.popular}</h2>
            <p>{t.popularSub}</p>
          </div>
          <button onClick={() => setPage("Library")}>{t.see}</button>
        </section>
        {songList()}
      </>
    );
  };
  const menuSong = menu
    ? shown.find((item) => String(item.id) === String(menu.id))
    : null;
  return (
    <div className="app-shell">
      <audio
        ref={player}
        src={audioUrl}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() =>
          repeat
            ? ((player.current.currentTime = 0), player.current.play())
            : change(1)
        }
      />
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header-row">
          <div className="brand">
            <span className="brand-mark">S</span>
            <span>sonora</span>
          </div>
          <button
            className="sidebar-close-btn"
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav>
          {[
            [Home, "Home", t.home],
            [Compass, "Discover", t.discover],
            [Radio, "Radio", t.radio],
            [Library, "Library", t.library],
          ].map(([I, k, n]) => (
            <button
              className={page === k ? "nav-item active" : "nav-item"}
              key={k}
              onClick={() => {
                setPage(k);
                setMobileMenuOpen(false);
              }}
            >
              <I size={19} />
              {n}
            </button>
          ))}
        </nav>
        <div className="sidebar-label">{t.music}</div>
        <button
          className={page === "Favorites" ? "nav-item active" : "nav-item"}
          onClick={() => {
            setPage("Favorites");
            setMobileMenuOpen(false);
          }}
        >
          <Heart size={19} />
          {t.favorites}
        </button>
        <button
          className={page === "Playlists" ? "nav-item active" : "nav-item"}
          onClick={() => {
            setPage("Playlists");
            setMobileMenuOpen(false);
          }}
        >
          <ListMusic size={19} />
          {t.playlists}
        </button>
        <button
          className="create-playlist"
          onClick={() => {
            setModal(true);
            setMobileMenuOpen(false);
          }}
        >
          <Plus size={18} />
          {t.create}
        </button>
        <div className="playlist-list">
          {lists.map((x) => (
            <div className="playlist-item" key={x}>
              <button
                onClick={() => {
                  setPage("Playlists");
                  setMobileMenuOpen(false);
                  setToast(`${x} is ready to play.`);
                }}
              >
                {x}
              </button>
              <button
                className="playlist-delete"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteList(x);
                }}
                aria-label={`Delete ${x}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          className="sidebar-theme-btn"
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("sonora-open-theme"));
            setMobileMenuOpen(false);
          }}
        >
          <Palette size={17} />
          <span>{language === "th" ? "ปรับแต่งธีม" : "Theme studio"}</span>
        </button>
        <label className="language-select">
          <Languages size={17} />
          <span>{t.language}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="th">ไทย</option>
          </select>
        </label>
        {currentUser ? (
          <div
            className="profile"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("sonora-open-profile"));
              setMobileMenuOpen(false);
            }}
          >
            <div className="avatar">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" />
              ) : (
                (currentUser.name || "U").slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.email || t.premium}</small>
            </div>
            <button
              className="sidebar-logout-btn"
              type="button"
              title={language === "th" ? "ออกจากระบบ" : "Sign out"}
              onClick={(e) => {
                e.stopPropagation();
                localStorage.removeItem("sonora-user");
                localStorage.removeItem("sonora-token");
                setCurrentUser(null);
                window.dispatchEvent(new Event("sonora-auth-changed"));
                setToast(language === "th" ? "ออกจากระบบแล้ว" : "Signed out");
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            className="sidebar-login-btn"
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("sonora-open-account"));
              setMobileMenuOpen(false);
            }}
          >
            <LogIn size={17} />
            <span>{language === "th" ? "เข้าสู่ระบบ" : "Log in"}</span>
          </button>
        )}
      </aside>
      <main className="content">
        <header>
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="history">
            <button onClick={() => history.back()}>
              <ChevronLeft />
            </button>
            <button onClick={() => history.forward()}>
              <ChevronRight />
            </button>
          </div>
          <label className="search">
            <Search size={19} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={15} />
              </button>
            )}
          </label>
        </header>
        {main()}
      </main>
      {song && (
        <footer className="player">
          <div
            className="mobile-player-progress"
            style={{ width: `${((time / (duration || 1)) * 100).toFixed(1)}%` }}
          />
          <div className={art(song.art)}>
            <span>{song.title[0]}</span>
          </div>
          <div className="now-playing">
            <strong>{song.title}</strong>
            <small>{song.artist}</small>
          </div>
          <button className="player-heart" onClick={() => fav(song.id)}>
            <Heart
              size={18}
              fill={favorites.includes(song.id) ? "currentColor" : "none"}
            />
          </button>
          <div className="controls">
            <div>
              <button
                className={shuffle ? "enabled" : ""}
                onClick={() => setShuffle(!shuffle)}
              >
                <Shuffle size={16} />
              </button>
              <button className="skip-btn skip-back" onClick={() => change(-1)}>
                <SkipBack size={19} fill="currentColor" />
              </button>
              <button
                className="main-control"
                onClick={() => setPlaying(!playing)}
              >
                {playing ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>
              <button className="skip-btn skip-forward" onClick={() => change(1)}>
                <SkipForward size={19} fill="currentColor" />
              </button>
              <button
                className={repeat ? "enabled" : ""}
                onClick={() => setRepeat(!repeat)}
              >
                <Repeat2 size={16} />
              </button>
            </div>
            <div className="timeline">
              <span>{fmt(time)}</span>
              <input
                type="range"
                min="0"
                max={duration || 1}
                value={time}
                onChange={(e) => {
                  let v = Number(e.target.value);
                  setTime(v);
                  player.current.currentTime = v;
                }}
              />
              <span>{fmt(duration)}</span>
            </div>
          </div>
          <div className="volume">
            <button onClick={() => setVolume(volume ? 0 : 70)}>
              {volume ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
            <PanelRight size={19} />
          </div>
        </footer>
      )}
      <nav className="mobile-bottom-nav">
        {[
          [Home, "Home", t.home],
          [Compass, "Discover", t.discover],
          [Radio, "Radio", t.radio],
          [Library, "Library", t.library],
          [Heart, "Favorites", t.favorites],
        ].map(([I, k, n]) => (
          <button
            key={k}
            type="button"
            className={page === k ? "mobile-nav-item active" : "mobile-nav-item"}
            onClick={() => setPage(k)}
          >
            <I size={20} />
            <span>{n}</span>
          </button>
        ))}
      </nav>
      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(false)}>
          <form
            className="playlist-modal"
            onSubmit={create}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setModal(false)}
            >
              <X size={18} />
            </button>
            <h2>{t.newList}</h2>
            <p>{t.newHint}</p>
            <input
              autoFocus
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder={t.name}
            />
            <div>
              <button type="button" onClick={() => setModal(false)}>
                {t.cancel}
              </button>
              <button className="confirm">
                <Check size={16} />
                {t.create}
              </button>
            </div>
          </form>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
      {menuSong &&
        createPortal(
          <div
            className="song-menu"
            style={{ top: menu.top, left: menu.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <small>{t.moveTo}</small>
            {lists.map((list) => (
              <button
                type="button"
                key={list}
                onClick={(e) => {
                  e.stopPropagation();
                  moveToList(menuSong, list);
                }}
              >
                {list}
              </button>
            ))}
            <button
              type="button"
              className="delete-song"
              onClick={(e) => {
                e.stopPropagation();
                removeAlbum(menuSong);
              }}
            >
              {t.removeAlbum}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
function YouTubeSearch() {
  const [open, setOpen] = useState(false),
    [term, setTerm] = useState(""),
    [results, setResults] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [video, setVideo] = useState(null),
    [saved, setSaved] = useState("");
  const choose = (item) => {
    setVideo(item);
    setSaved("");
    localStorage.setItem("sonora-selected-youtube", JSON.stringify(item));
  };
  const search = async (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(term)}`,
        ),
        data = await readJson(r);
      if (!r.ok) throw Error(data.error);
      setResults(data);
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };
  const add = async () => {
    const token = localStorage.getItem("sonora-token");
    if (!token) {
      setSaved("กรุณา Log in ก่อนเพิ่มเพลง");
      return;
    }
    try {
      const r = await fetch("/api/album", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(video),
        }),
        data = await readJson(r);
      if (!r.ok) throw Error(data.error);
      window.dispatchEvent(new Event("sonora-album-updated"));
      setSaved("เพิ่มเพลงเข้าอัลบั้มแล้ว");
    } catch (error) {
      setSaved(error.message || "เพิ่มเพลงไม่สำเร็จ");
    }
  };
  return (
    <>
      <button className="youtube-launcher" onClick={() => setOpen(true)}>
        <Search size={18} />
        Search YouTube
      </button>
      {open && (
        <div className="youtube-backdrop" onMouseDown={() => setOpen(false)}>
          <section
            className="youtube-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setOpen(false)}>
              <X size={19} />
            </button>
            <div className="youtube-title">
              <span className="youtube-logo">▶</span>
              <div>
                <strong>YouTube Music Search</strong>
                <small>ค้นหาและเลือกเพลงจาก YouTube</small>
              </div>
            </div>
            <form className="youtube-form" onSubmit={search}>
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ค้นหาชื่อเพลง ศิลปิน หรืออัลบั้มบน YouTube"
              />
              <button>{loading ? "Searching…" : "Search"}</button>
            </form>
            {error && <p className="youtube-error">{error}</p>}
            <div className="youtube-results">
              {results.map((item) => (
                <button
                  className={
                    video?.id === item.id
                      ? "youtube-result chosen"
                      : "youtube-result"
                  }
                  key={item.id}
                  onClick={() => choose(item)}
                >
                  <img src={item.thumbnail} alt="" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.artist} · {item.duration}
                    </small>
                  </span>
                  <Play size={18} />
                </button>
              ))}
            </div>
            {video && (
              <div className="youtube-player">
                <iframe
                  title={video.title}
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
                <div className="youtube-player-info">
                  <span>
                    <strong>{video.title}</strong>
                    <small>{video.artist}</small>
                  </span>
                  <button onClick={add}>
                    <Plus size={16} />
                    เพิ่มเข้าอัลบั้ม
                  </button>
                </div>
                {saved && <small className="youtube-saved">{saved}</small>}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
function Account() {
  const [user, setUser] = useState(() =>
      JSON.parse(localStorage.getItem("sonora-user") || "null"),
    ),
    [open, setOpen] = useState(false),
    [mode, setMode] = useState("login"),
    [form, setForm] = useState({ name: "", email: "", password: "", code: "" }),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "forgot") {
        const r = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email }),
          }),
          data = await readJson(r);
        if (!r.ok) throw Error(data.error || "ไม่พบบัญชีจากอีเมลนี้");
        setNotice(`รหัสยืนยันสำหรับทดสอบ: ${data.demoCode}`);
        setMode("reset");
        return;
      }
      if (mode === "reset") {
        const r = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }),
          data = await readJson(r);
        if (!r.ok) throw Error(data.error);
        setNotice("เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบ");
        setMode("login");
        return;
      }
      const r = await fetch(
          `/api/auth/${mode === "login" ? "login" : "register"}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        ),
        data = await readJson(r);
      if (!r.ok) throw Error(data.error || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      localStorage.setItem("sonora-user", JSON.stringify(data.user));
      localStorage.setItem("sonora-token", data.token);
      setUser(data.user);
      setOpen(false);
      window.dispatchEvent(new Event("sonora-auth-changed"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const onOpen = () => {
      setMode("login");
      setError("");
      setNotice("");
      setOpen(true);
    };
    window.addEventListener("sonora-open-account", onOpen);
    return () => window.removeEventListener("sonora-open-account", onOpen);
  }, []);
  const title = {
      login: "Welcome back",
      register: "Create your account",
      forgot: "ลืมรหัสผ่าน",
      reset: "ตั้งรหัสผ่านใหม่",
    }[mode],
    description = {
      login: "Log in to save your music and albums.",
      register: "Create an account to save your music and albums.",
      forgot: "กรอกอีเมลของบัญชีเพื่อรับรหัสยืนยัน",
      reset: "กรอกรหัสยืนยัน 6 หลักและรหัสผ่านใหม่",
    }[mode];
  return (
    open && (
      <div className="account-backdrop" onMouseDown={() => setOpen(false)}>
        <form
          className="account-modal"
          onSubmit={submit}
          onMouseDown={(e) => e.stopPropagation()}
        >
            <button
              className="modal-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            <div className="account-mark">S</div>
            <h2>{title}</h2>
            <p>{description}</p>
            {mode === "register" && (
              <input
                placeholder="Display name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {mode === "reset" && (
              <input
                inputMode="numeric"
                maxLength="6"
                placeholder="รหัสยืนยัน 6 หลัก"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            )}{" "}
            {mode !== "forgot" && (
              <input
                type="password"
                placeholder="Password (at least 6 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}{" "}
            {notice && <small className="auth-notice">{notice}</small>}
            {error && <small className="auth-error">{error}</small>}
            <button className="auth-submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Log in"
                  : mode === "register"
                    ? "Create account"
                    : mode === "forgot"
                      ? "รับรหัสยืนยัน"
                      : "เปลี่ยนรหัสผ่าน"}
            </button>
            {mode === "login" && (
              <button
                className="auth-switch"
                type="button"
                onClick={() => switchMode("forgot")}
              >
                ลืมรหัสผ่าน?
              </button>
            )}
            <button
              className="auth-switch"
              type="button"
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login"
                ? "New here? Create an account"
                : "กลับไปเข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      )
    );
  }
function MyAlbum() {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState([]),
    [message, setMessage] = useState(""),
    token = () => localStorage.getItem("sonora-token"),
    headers = () => (token() ? { Authorization: `Bearer ${token()}` } : {}),
    load = async () => {
      if (!token()) {
        setItems([]);
        return;
      }
      try {
        const r = await fetch("/api/album", { headers: headers() });
        if (!r.ok) throw Error();
        const list = await readJson(r);
        const deleted = getDeletedIds("sonora-deleted-album");
        setItems(list.filter((item) => !deleted.includes(String(item.id))));
      } catch {
        setMessage("ไม่สามารถโหลดอัลบั้มได้");
      }
    };
  const show = () => {
    setMessage("");
    window.dispatchEvent(new Event("sonora-open-library"));
    setOpen(true);
    load();
  };
  const save = async () => {
    if (!token()) {
      setMessage("กรุณา Log in ก่อนเพิ่มเพลงเข้าอัลบั้ม");
      return;
    }
    let selected;
    try {
      selected = JSON.parse(
        localStorage.getItem("sonora-selected-youtube") || "null",
      );
    } catch {}
    if (!selected?.id || !selected?.title) {
      setMessage("เลือกเพลงจากผลค้นหา YouTube ก่อน");
      return;
    }
    try {
      const r = await fetch("/api/album", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers() },
          body: JSON.stringify(selected),
        }),
        data = await readJson(r);
      if (!r.ok) throw Error(data.error);
      setItems((x) => [...x, data]);
      window.dispatchEvent(new Event("sonora-album-updated"));
      setMessage("เพิ่มเพลงเข้าอัลบั้มแล้ว");
    } catch (err) {
      setMessage(err.message || "เพิ่มเพลงไม่สำเร็จ");
    }
  };
  const remove = async (id) => {
    try {
      const r = await fetch(`/api/album/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!r.ok) throw Error();
      saveDeletedId("sonora-deleted-album", id);
      setItems((x) => x.filter((item) => String(item.id) !== String(id)));
      window.dispatchEvent(new Event("sonora-album-updated"));
    } catch {
      setMessage("ลบเพลงไม่สำเร็จ");
    }
  };
  return (
    <>
      <button className="album-launcher" onClick={show}>
        <Music2 size={18} />
        My album
      </button>
      {open && (
        <div className="album-backdrop" onMouseDown={() => setOpen(false)}>
          <section
            className="album-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
            <h2>อัลบั้มของฉัน</h2>
            <p>
              {token()
                ? "เลือกเพลงจาก YouTube แล้วกดเพิ่มเข้าอัลบั้ม"
                : "Log in เพื่อบันทึกอัลบั้มของคุณ"}
            </p>
            <button className="add-current" onClick={save}>
              <Plus size={17} />
              เพิ่มเพลง YouTube ที่เลือก
            </button>
            {message && <small className="album-message">{message}</small>}
            <div className="album-items">
              {items.map((x) => (
                <div key={x.id}>
                  <span>
                    <strong>{x.title}</strong>
                    <small>{x.artist}</small>
                  </span>
                  <button onClick={() => remove(x.id)} aria-label="Remove song">
                    <X size={16} />
                  </button>
                </div>
              ))}
              {!items.length && (
                <span className="album-empty">ยังไม่มีเพลงในอัลบั้ม</span>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function UploadMusic() {
  const [file, setFile] = useState(null),
    [open, setOpen] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("sonora-upload", show);
    return () => window.removeEventListener("sonora-upload", show);
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("sonora-token");
    if (!token) return setMessage("กรุณา Log in ก่อนอัปโหลดเพลง");
    if (!file) return setMessage("เลือกไฟล์เพลงก่อน");
    setBusy(true);
    const data = new FormData();
    data.append("audio", file);
    try {
      const r = await fetch("/api/album/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        }),
        result = await readJson(r);
      if (!r.ok) throw Error(result.error);
      window.dispatchEvent(new Event("sonora-album-updated"));
      setMessage("อัปโหลดเพลงสำเร็จ");
      setFile(null);
    } catch (error) {
      setMessage(error.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {open && (
        <div className="album-backdrop" onMouseDown={() => setOpen(false)}>
          <form
            className="album-modal upload-modal"
            onSubmit={submit}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            <h2>อัปโหลดเพลง</h2>
            <p>เลือก MP3, WAV, OGG หรือ M4A (ไม่เกิน 25 MB)</p>
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && <small>{file.name}</small>}
            {message && <small className="album-message">{message}</small>}
            <button className="add-current" disabled={busy}>
              {busy ? "กำลังอัปโหลด…" : "อัปโหลดเข้าอัลบั้ม"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
function YouTubeLink() {
  const [open, setOpen] = useState(false),
    [url, setUrl] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("sonora-youtube-link", show);
    return () => window.removeEventListener("sonora-youtube-link", show);
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("sonora-token");
    if (!token) return setMessage("กรุณา Log in ก่อนเพิ่มลิงก์");
    setBusy(true);
    try {
      const r = await fetch("/api/album/youtube-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url }),
        }),
        item = await readJson(r);
      if (!r.ok) throw Error(item.error);
      window.dispatchEvent(new Event("sonora-album-updated"));
      setMessage("เพิ่มเพลงเข้าอัลบั้มแล้ว");
      setUrl("");
    } catch (error) {
      setMessage(error.message || "เพิ่มลิงก์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {open && (
        <div className="album-backdrop" onMouseDown={() => setOpen(false)}>
          <form
            className="album-modal upload-modal"
            onSubmit={submit}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            <h2>วางลิงก์ YouTube</h2>
            <p>เพิ่มเพลงจากลิงก์ YouTube เข้าอัลบั้มของคุณ</p>
            <input
              className="link-input"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {message && <small className="album-message">{message}</small>}
            <button className="add-current" disabled={busy}>
              {busy ? "กำลังเพิ่ม…" : "เพิ่มเข้าอัลบั้ม"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
function MusicActions() {
  const [open, setOpen] = useState(false),
    run = (selector) => {
      setOpen(false);
      document.querySelector(selector)?.click();
    };
  return (
    <div className="music-actions">
      <div className={open ? "music-action-menu open" : "music-action-menu"}>
        <button
          onClick={() => {
            setOpen(false);
            window.dispatchEvent(new Event("sonora-upload"));
          }}
        >
          <Plus size={17} />
          อัปโหลดเพลง
        </button>
        <button onClick={() => run(".youtube-launcher")}>
          <Search size={17} />
          ค้นหา YouTube
        </button>
      </div>
      <button className="music-action-main" onClick={() => setOpen(!open)}>
        <Music2 size={19} />
        เพลงของฉัน
      </button>
    </div>
  );
}
function ThemeStudio() {
  const [open, setOpen] = useState(false),
    [theme, setTheme] = useState(
      () => localStorage.getItem("sonora-theme") || "classic",
    ),
    [motion, setMotion] = useState(
      () => localStorage.getItem("sonora-motion") !== "off",
    );
  useEffect(() => {
    const launch = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      setOpen(true);
    };
    window.addEventListener("sonora-open-theme", launch);
    const button = document.querySelector(".upgrade");
    if (button) {
      button.textContent = "Theme studio";
      button.addEventListener("click", launch, true);
    }
    return () => {
      window.removeEventListener("sonora-open-theme", launch);
      button?.removeEventListener("click", launch, true);
    };
  }, []);
  useEffect(() => {
    const shell = document.querySelector(".app-shell");
    if (shell) {
      shell.classList.remove(
        "theme-classic",
        "theme-midnight",
        "theme-sunset",
        "theme-lilac",
      );
      shell.classList.add(`theme-${theme}`);
      shell.classList.toggle("no-motion", !motion);
    }
    localStorage.setItem("sonora-theme", theme);
    localStorage.setItem("sonora-motion", motion ? "on" : "off");
  }, [theme, motion]);
  const themes = [
    ["classic", "Classic", "Fresh ivory"],
    ["midnight", "Midnight", "Deep blue"],
    ["sunset", "Sunset", "Warm coral"],
    ["lilac", "Lilac", "Soft purple"],
  ];
  return (
    open && (
      <div className="theme-backdrop" onMouseDown={() => setOpen(false)}>
        <section
          className="theme-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button className="modal-close" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
          <span className="theme-kicker">PERSONALIZE</span>
          <h2>Theme studio</h2>
          <p>เลือกบรรยากาศที่เหมาะกับการฟังของคุณ</p>
          <div className="theme-grid">
            {themes.map(([id, name, detail]) => (
              <button
                className={
                  theme === id ? "theme-choice selected" : "theme-choice"
                }
                key={id}
                onClick={() => setTheme(id)}
              >
                <i className={`theme-preview ${id}`} />
                <strong>{name}</strong>
                <small>{detail}</small>
                {theme === id && <Check size={15} />}
              </button>
            ))}
          </div>
          <label className="motion-toggle">
            <span>
              <strong>Ambient motion</strong>
              <small>เปิดเอฟเฟกต์พื้นหลังแบบนุ่มนวล</small>
            </span>
            <input
              type="checkbox"
              checked={motion}
              onChange={(e) => setMotion(e.target.checked)}
            />
          </label>
        </section>
      </div>
    )
  );
}
function LanguageLocalizer() {
  useEffect(() => {
    const pairs = {
      en: {
        หน้าหลัก: "Home",
        ค้นหาเพลง: "Discover",
        วิทยุ: "Radio",
        คลังเพลงของคุณ: "Your Library",
        เพลงของคุณ: "YOUR MUSIC",
        เพลงโปรด: "Favorites",
        เพลย์ลิสต์: "Playlists",
        สร้างเพลย์ลิสต์: "Create playlist",
        ภาษา: "Language",
        เล่นทั้งหมด: "Play all",
        ชื่อเพลง: "TITLE",
        อัลบั้ม: "ALBUM",
        อัลบั้มของฉัน: "My album",
        ย้ายไปเพลย์ลิสต์: "Move to playlist",
        ลบออกจากอัลบั้มของฉัน: "Remove from My album",
        "ค้นหา YouTube": "Search YouTube",
        "วางลิงก์ YouTube": "Paste YouTube link",
        อัปโหลดเพลง: "Upload music",
        เพลงของฉัน: "My music",
        ลืมรหัสผ่าน: "Forgot password",
        รับรหัสยืนยัน: "Get verification code",
        ตั้งรหัสผ่านใหม่: "Set a new password",
        เปลี่ยนรหัสผ่าน: "Change password",
        กลับไปเข้าสู่ระบบ: "Back to log in",
        กรอกอีเมลของบัญชีเพื่อรับรหัสยืนยัน:
          "Enter your account email to receive a verification code",
        "กรอกรหัสยืนยัน 6 หลักและรหัสผ่านใหม่":
          "Enter the 6-digit code and your new password",
        "รหัสยืนยัน 6 หลัก": "6-digit verification code",
        ไม่พบเพลง: "No songs found",
        "เพิ่มเพลง YouTube ที่เลือก": "Add selected YouTube song",
        เพิ่มเพลงเข้าอัลบั้มแล้ว: "Song added to album",
        "กำลังเพิ่ม…": "Adding…",
        "กำลังอัปโหลด…": "Uploading…",
        อัปโหลดเข้าอัลบั้ม: "Upload to album",
        เลือกไฟล์เพลงก่อน: "Choose an audio file first",
        "เพิ่มเพลงจากลิงก์ YouTube เข้าอัลบั้มของคุณ":
          "Add a YouTube link to your album",
        เลือกบรรยากาศที่เหมาะกับการฟังของคุณ:
          "Choose a mood that fits your listening",
        เปิดเอฟเฟกต์พื้นหลังแบบนุ่มนวล: "Enable subtle background motion",
        คลาสสิก: "Classic",
        มิดไนต์: "Midnight",
        ซันเซ็ต: "Sunset",
        ไลแลค: "Lilac",
        ไอวอรีนุ่มนวล: "Fresh ivory",
        น้ำเงินเข้ม: "Deep blue",
        คอรัลอบอุ่น: "Warm coral",
        ม่วงละมุน: "Soft purple",
        เข้าสู่ระบบ: "Log in",
        ออกจากระบบ: "Sign out",
        ไม่พบบัญชีผู้ใช้ที่ลงทะเบียนด้วยอีเมลนี้:
          "No account is registered with this email",
      },
      th: {
        Home: "หน้าหลัก",
        Discover: "ค้นหาเพลง",
        Radio: "วิทยุ",
        "Your Library": "คลังเพลงของคุณ",
        "YOUR MUSIC": "เพลงของคุณ",
        Favorites: "เพลงโปรด",
        Playlists: "เพลย์ลิสต์",
        "Create playlist": "สร้างเพลย์ลิสต์",
        Language: "ภาษา",
        "Play all": "เล่นทั้งหมด",
        TITLE: "ชื่อเพลง",
        ALBUM: "อัลบั้ม",
        "My album": "อัลบั้มของฉัน",
        "Move to playlist": "ย้ายไปเพลย์ลิสต์",
        "Remove from My album": "ลบออกจากอัลบั้มของฉัน",
        "Search YouTube": "ค้นหา YouTube",
        "Paste YouTube link": "วางลิงก์ YouTube",
        "Upload music": "อัปโหลดเพลง",
        "My music": "เพลงของฉัน",
        "Forgot password": "ลืมรหัสผ่าน",
        "Get verification code": "รับรหัสยืนยัน",
        "Set a new password": "ตั้งรหัสผ่านใหม่",
        "Change password": "เปลี่ยนรหัสผ่าน",
        "Back to log in": "กลับไปเข้าสู่ระบบ",
        "Enter your account email to receive a verification code":
          "กรอกอีเมลของบัญชีเพื่อรับรหัสยืนยัน",
        "Enter the 6-digit code and your new password":
          "กรอกรหัสยืนยัน 6 หลักและรหัสผ่านใหม่",
        "6-digit verification code": "รหัสยืนยัน 6 หลัก",
        "No songs found": "ไม่พบเพลง",
        "Add selected YouTube song": "เพิ่มเพลง YouTube ที่เลือก",
        "Song added to album": "เพิ่มเพลงเข้าอัลบั้มแล้ว",
        "Adding…": "กำลังเพิ่ม…",
        "Uploading…": "กำลังอัปโหลด…",
        "Upload to album": "อัปโหลดเข้าอัลบั้ม",
        "Choose an audio file first": "เลือกไฟล์เพลงก่อน",
        "Add a YouTube link to your album":
          "เพิ่มเพลงจากลิงก์ YouTube เข้าอัลบั้มของคุณ",
        "Choose a mood that fits your listening":
          "เลือกบรรยากาศที่เหมาะกับการฟังของคุณ",
        "Ambient motion": "เอฟเฟกต์พื้นหลัง",
        "Enable subtle background motion": "เปิดเอฟเฟกต์พื้นหลังแบบนุ่มนวล",
        Classic: "คลาสสิก",
        Midnight: "มิดไนต์",
        Sunset: "ซันเซ็ต",
        Lilac: "ไลแลค",
        "Fresh ivory": "ไอวอรีนุ่มนวล",
        "Deep blue": "น้ำเงินเข้ม",
        "Warm coral": "คอรัลอบอุ่น",
        "Soft purple": "ม่วงละมุน",
        "Welcome back": "ยินดีต้อนรับกลับ",
        "Create your account": "สร้างบัญชีผู้ใช้",
        "Log in": "เข้าสู่ระบบ",
        "Sign out": "ออกจากระบบ",
        "New here? Create an account": "ยังไม่มีบัญชี? สร้างบัญชี",
        "Password (at least 6 characters)": "รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)",
        "Email address": "อีเมล",
        "Display name": "ชื่อที่แสดง",
        "Theme studio": "ปรับธีม",
        PERSONALIZE: "ปรับแต่ง",
      },
    };
    const translate = () => {
      const map = pairs[localStorage.getItem("sonora-language") || "en"];
      document.querySelectorAll("body *").forEach((node) => {
        if (
          node.children.length === 0 &&
          node.childNodes.length === 1 &&
          node.firstChild.nodeType === 3
        ) {
          const text = node.textContent.trim();
          if (map[text])
            node.textContent = node.textContent.replace(text, map[text]);
        }
        if (
          node instanceof HTMLInputElement &&
          node.placeholder &&
          map[node.placeholder]
        )
          node.placeholder = map[node.placeholder];
      });
    };
    translate();
    const observer = new MutationObserver(translate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const interval = setInterval(translate, 350);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);
  return null;
}
function ProfilePage() {
  const [open, setOpen] = useState(false),
    [user, setUser] = useState(
      () =>
        JSON.parse(localStorage.getItem("sonora-user") || "null") || {
          name: "Alex Morgan",
          email: "",
        },
    ),
    [bio, setBio] = useState(
      () =>
        localStorage.getItem("sonora-profile-bio") ||
        "Music lover and playlist curator.",
    ),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const launch = (e) => {
      if (e.target.closest(".profile")) setOpen(true);
    };
    document.addEventListener("click", launch);
    return () => document.removeEventListener("click", launch);
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const token = localStorage.getItem("sonora-token");
      if (token) {
        const r = await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(user),
          }),
          data = await readJson(r);
        if (!r.ok) throw Error(data.error);
        setUser(data.user);
        localStorage.setItem("sonora-user", JSON.stringify(data.user));
      } else localStorage.setItem("sonora-user", JSON.stringify(user));
      localStorage.setItem("sonora-profile-bio", bio);
      document.querySelector(".profile strong") &&
        (document.querySelector(".profile strong").textContent = user.name);
      setMessage("บันทึกโปรไฟล์แล้ว");
    } catch (error) {
      setMessage(error.message || "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  return (
    open && (
      <div className="profile-page">
        <header className="profile-page-header">
          <button onClick={() => setOpen(false)}>
            <ChevronLeft size={20} />
            กลับหน้าหลัก
          </button>
          <span>PROFILE</span>
        </header>
        <main className="profile-content">
          <section className="profile-cover">
            <div className="profile-avatar-large">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p>YOUR PROFILE</p>
              <h1>{user.name}</h1>
              <span>{user.email || "Music member"}</span>
            </div>
          </section>
          <form className="profile-form" onSubmit={save}>
            <div className="profile-form-head">
              <div>
                <p>ACCOUNT SETTINGS</p>
                <h2>แก้ไขโปรไฟล์</h2>
              </div>
              <button disabled={busy}>
                {busy ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
            <label>
              ชื่อที่แสดง
              <input
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                required
              />
            </label>
            <label>
              อีเมล
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </label>
            <label>
              เกี่ยวกับคุณ
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength="180"
              />
            </label>
            {message && <small className="profile-message">{message}</small>}
          </form>
        </main>
      </div>
    )
  );
}
function ProfileAvatarPicker() {
  useEffect(() => {
    const paint = () => {
      const user = JSON.parse(localStorage.getItem("sonora-user") || "null"),
        avatar = user?.avatarUrl,
        large = document.querySelector(".profile-avatar-large");
      if (avatar && large && !large.querySelector("img"))
        large.innerHTML = `<img src="${avatar}" alt="Profile photo">`;
      const small = document.querySelector(".profile .avatar");
      if (avatar && small) small.innerHTML = `<img src="${avatar}" alt="">`;
      if (large && !document.querySelector(".avatar-upload-input")) {
        const input = document.createElement("input");
        input.className = "avatar-upload-input";
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/webp";
        input.title = "เปลี่ยนรูปโปรไฟล์";
        input.addEventListener("change", async () => {
          const file = input.files?.[0],
            token = localStorage.getItem("sonora-token");
          if (!file || !token) return;
          if (file.size > 5 * 1024 * 1024)
            return alert("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
          const data = new FormData();
          data.append("avatar", file);
          try {
            const r = await fetch("/api/auth/profile/avatar", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: data,
              }),
              result = await readJson(r);
            if (!r.ok) throw Error(result.error);
            localStorage.setItem("sonora-user", JSON.stringify(result.user));
            large.innerHTML = `<img src="${result.user.avatarUrl}" alt="Profile photo">`;
            const sidebar = document.querySelector(".profile .avatar");
            if (sidebar)
              sidebar.innerHTML = `<img src="${result.user.avatarUrl}" alt="">`;
          } catch (error) {
            alert(error.message || "อัปโหลดรูปไม่สำเร็จ");
          }
        });
        large.parentElement.appendChild(input);
      }
    };
    paint();
    const timer = setInterval(paint, 350);
    return () => clearInterval(timer);
  }, []);
  return null;
}
function PlaylistNameLocalizer() {
  useEffect(() => {
    const th = {
        "Summer nights": "คืนฤดูร้อน",
        "Feel good songs": "เพลงฟังสบาย",
        "On repeat": "เพลงที่ฟังซ้ำ",
        "Late night jazz": "แจ๊สยามดึก",
      },
      en = Object.fromEntries(Object.entries(th).map(([a, b]) => [b, a]));
    const apply = () => {
      const map =
        (localStorage.getItem("sonora-language") || "en") === "th" ? th : en;
      document.querySelectorAll(".playlist-list button").forEach((button) => {
        if (map[button.textContent.trim()])
          button.textContent = map[button.textContent.trim()];
      });
    };
    apply();
    const timer = setInterval(apply, 250);
    return () => clearInterval(timer);
  }, []);
  return null;
}
function LanguageRefresh() {
  useEffect(() => {
    const onChange = (e) => {
      if (e.target.matches(".language-select select")) {
        localStorage.setItem("sonora-language", e.target.value);
        window.location.reload();
      }
    };
    document.addEventListener("change", onChange, true);
    return () => document.removeEventListener("change", onChange, true);
  }, []);
  return null;
}
function TextNodeLocalizer() {
  useEffect(() => {
    const enToTh = {
      "YOUR DAILY MIX": "มิกซ์ประจำวันของคุณ",
      "Made for your": "คัดสรรเพื่อ",
      "mood.": "ทุกอารมณ์",
      "A fresh selection of sounds you'll love.":
        "เพลงคัดสรรใหม่ที่คุณจะหลงรัก",
      "Play all": "เล่นทั้งหมด",
      "Play selection": "เล่นรายการที่เลือก",
      "Start radio": "เริ่มวิทยุ",
      "LIVE STATION": "สถานีถ่ายทอดสด",
      "Theme studio": "ปรับธีม",
      Upgrade: "อัปเกรด",
      "See all": "ดูทั้งหมด",
      "Recently played": "เพลงที่เพิ่งเล่น",
      "Pick up where you left off": "กลับมาฟังต่อจากครั้งล่าสุด",
      "Popular right now": "กำลังฮิตตอนนี้",
      "What everyone's listening to": "เพลงที่ทุกคนกำลังฟัง",
      "Discover something new": "พบกับเพลงใหม่",
      "A curated selection for your next listen.":
        "เพลงคัดสรรสำหรับการฟังครั้งต่อไปของคุณ",
      "Welcome back": "ยินดีต้อนรับกลับ",
      "Create your account": "สร้างบัญชีผู้ใช้",
      "Log in to save your music and albums.":
        "เข้าสู่ระบบเพื่อบันทึกเพลงและอัลบั้มของคุณ",
      "Create an account to save your music and albums.":
        "สร้างบัญชีเพื่อบันทึกเพลงและอัลบั้มของคุณ",
      "Log in": "เข้าสู่ระบบ",
      "Sign out": "ออกจากระบบ",
      "Create account": "สร้างบัญชี",
      "New here? Create an account": "ยังไม่มีบัญชี? สร้างบัญชี",
      "Please wait…": "กรุณารอสักครู่…",
      "My album": "อัลบั้มของฉัน",
      "Search YouTube": "ค้นหา YouTube",
      "Upload music": "อัปโหลดเพลง",
      "Paste YouTube link": "วางลิงก์ YouTube",
      "My music": "เพลงของฉัน",
      "No songs found": "ไม่พบเพลง",
      "Premium member": "สมาชิกพรีเมียม",
    };
    const thToEn = Object.fromEntries(
      Object.entries(enToTh).map(([a, b]) => [b, a]),
    );
    const apply = () => {
      const map =
        (localStorage.getItem("sonora-language") || "en") === "th"
          ? enToTh
          : thToEn;
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      let node;
      while ((node = walker.nextNode())) {
        const raw = node.nodeValue,
          clean = raw.trim();
        if (map[clean]) node.nodeValue = raw.replace(clean, map[clean]);
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const timer = setInterval(apply, 250);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, []);
  return null;
}
createRoot(document.getElementById("root")).render(
  <>
    <App />
    <YouTubeSearch />
    <MyAlbum />
    <UploadMusic />
    <MusicActions />
    <ThemeStudio />
    <LanguageLocalizer />
    <TextNodeLocalizer />
    <PlaylistNameLocalizer />
    <LanguageRefresh />
    <ProfilePage />
    <ProfileAvatarPicker />
    <Account />
  </>,
);
