import React, { useState, useMemo } from "react";
import { Song, Member } from "../types/types";
import {
  Search,
  Music,
  Clock,
  Hash,
  Youtube,
  FileText,
  Plus,
  X,
  Loader2,
  Edit2,
  Trash2,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Star,
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";

interface SongLibraryProps {
  songs: Song[];
  currentUser: Member;
}

// Fuzzy match helper: checks if 'pattern' is a subsequence of 'text'
const fuzzyMatch = (text: string, pattern: string): boolean => {
  const t = text.toLowerCase();
  const p = pattern.toLowerCase();

  // If pattern is empty, it's a match
  if (!p) return true;

  // Optimization: specific check for simple substring
  if (t.includes(p)) return true;

  let tIndex = 0;
  let pIndex = 0;

  while (tIndex < t.length && pIndex < p.length) {
    if (t[tIndex] === p[pIndex]) {
      pIndex++;
    }
    tIndex++;
  }

  return pIndex === p.length;
};

// Capo Helper Logic
const MUSICAL_KEYS = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const getCapoPosition = (originalKey: string, targetKey: string) => {
  // Normalize keys (handle flats/sharps crudely for this demo)
  const normalize = (k: string) => {
    if (!k) return 0;
    // Map common equivalents
    const map: Record<string, string> = {
      Db: "C#",
      "D#": "Eb",
      Gb: "F#",
      "G#": "Ab",
      "A#": "Bb",
    };
    return MUSICAL_KEYS.indexOf(map[k] || k);
  };

  const origIndex = normalize(originalKey);
  const targetIndex = normalize(targetKey);

  if (origIndex === -1 || targetIndex === -1) return null;

  // Calculate diff
  let semitones = targetIndex - origIndex;
  if (semitones < 0) semitones += 12; // Wrap around

  // Capo acts as raising the pitch of the open strings.
  // To PLAY in G shapes but SOUND in Bb (3 semitones higher), you put capo on 3.
  // So if Target > Original, Capo = diff.
  return semitones;
};

export const SongLibrary: React.FC<SongLibraryProps> = ({
  songs,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const { showToast } = useToast();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capo Tool State
  const [targetKey, setTargetKey] = useState("");

  const initialFormState = {
    title: "",
    artist: "",
    originalKey: "",
    bpm: "",
    timeSignature: "4/4",
    lyrics: "",
    youtubeLink: "",
    chordChartLink: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  // Advanced Filtering Logic
  const filteredSongs = useMemo(() => {
    let result = songs;

    // 0. Filter by Favorites
    if (filterFavorites) {
      result = result.filter((song) =>
        song.favoritedBy?.includes(currentUser.id)
      );
    }

    if (!searchTerm.trim()) return result;

    // Split search into terms
    const rawTerms = searchTerm.split(/\s+/).filter((t) => t.length > 0);

    // Extract Filters
    const keyFilters: string[] = [];
    const tagFilters: string[] = [];
    const keywords: string[] = [];

    rawTerms.forEach((term) => {
      const lowerTerm = term.toLowerCase();
      if (lowerTerm.startsWith("key:")) {
        keyFilters.push(lowerTerm.substring(4));
      } else if (lowerTerm.startsWith("tag:")) {
        tagFilters.push(lowerTerm.substring(4));
      } else {
        keywords.push(term);
      }
    });

    return result.filter((song) => {
      // 1. Check Key Filter (Exact match on normalized key, OR logic)
      if (keyFilters.length > 0) {
        const songKey = song.originalKey.toLowerCase();
        const matchesKey = keyFilters.some((k) => songKey === k);
        if (!matchesKey) return false;
      }

      // 2. Check Tag Filter (Partial match on tags, AND logic for multiple tags)
      if (tagFilters.length > 0) {
        const songTagsLower = song.tags.map((t) => t.toLowerCase());
        // Song must match ALL tag filters provided (AND logic)
        const matchesAllTags = tagFilters.every((filterTag) =>
          songTagsLower.some((songTag) => songTag.includes(filterTag))
        );
        if (!matchesAllTags) return false;
      }

      // 3. Check Keywords (AND logic - all keywords must match something in the song)
      if (keywords.length > 0) {
        return keywords.every((keyword) => {
          const inTitle = fuzzyMatch(song.title, keyword);
          const inArtist = fuzzyMatch(song.artist, keyword);
          // For tags in general search, we use simple includes
          const inTags = song.tags.some((tag) =>
            tag.toLowerCase().includes(keyword.toLowerCase())
          );

          return inTitle || inArtist || inTags;
        });
      }

      return true;
    });
  }, [songs, searchTerm, filterFavorites, currentUser.id]);

  const toggleFavorite = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();

    const isFav = song.favoritedBy?.includes(currentUser.id);
    let newFavoritedBy = song.favoritedBy || [];

    if (isFav) {
      newFavoritedBy = newFavoritedBy.filter((id) => id !== currentUser.id);
    } else {
      newFavoritedBy = [...newFavoritedBy, currentUser.id];
    }

    const updatedSong = { ...song, favoritedBy: newFavoritedBy };

    // Optimistic update for local selection
    if (selectedSong?.id === song.id) {
      setSelectedSong(updatedSong);
    }

    try {
      await api.updateSong(updatedSong);
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      showToast("Failed to update favorite status", "error");
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (song: Song) => {
    setIsEditing(true);
    setFormData({
      title: song.title,
      artist: song.artist,
      originalKey: song.originalKey,
      bpm: song.bpm.toString(),
      timeSignature: song.timeSignature,
      lyrics: song.lyrics || "",
      youtubeLink: song.youtubeLink || "",
      chordChartLink: song.chordChartLink || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // In a real app, tags would be managed via UI input
      const songData = {
        title: formData.title,
        artist: formData.artist,
        originalKey: formData.originalKey,
        bpm: parseInt(formData.bpm) || 0,
        timeSignature: formData.timeSignature,
        lyrics: formData.lyrics,
        youtubeLink: formData.youtubeLink,
        chordChartLink: formData.chordChartLink,
        tags: isEditing && selectedSong ? selectedSong.tags : [], // Preserve existing tags
        usageCount: isEditing && selectedSong ? selectedSong.usageCount : 0,
        favoritedBy: isEditing && selectedSong ? selectedSong.favoritedBy : [], // Preserve favorites
      };

      if (isEditing && selectedSong) {
        await api.updateSong({ ...selectedSong, ...songData });
        showToast("Song updated successfully", "success");
        setSelectedSong({ ...selectedSong, ...songData }); // Optimistic update for detail view
      } else {
        await api.addSong(songData);
        showToast("Song added successfully", "success");
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      showToast("Failed to save song", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (!selectedSong) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSong) return;
    try {
      await api.deleteSong(selectedSong.id);
      showToast("Song deleted", "info");
      setSelectedSong(null);
      setIsDeleteModalOpen(false);
    } catch (e) {
      showToast("Failed to delete song", "error");
    }
  };

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm(`tag:${tag}`);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-140px)] gap-6">
        {/* List Panel */}
        <div className="w-full md:w-1/2 lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Song Library</h2>
            </div>
            <button
              onClick={openAddModal}
              className="p-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Add Song"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="p-4 pt-0 border-b border-slate-100 mt-4">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search songs..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setFilterFavorites(!filterFavorites)}
                className={`p-2 rounded-lg border transition-colors ${
                  filterFavorites
                    ? "bg-amber-50 border-amber-200 text-amber-500"
                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
                title="Filter by Favorites"
              >
                <Star
                  size={18}
                  fill={filterFavorites ? "currentColor" : "none"}
                />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 px-1">
              <HelpCircle size={10} />
              <span>Supports "tag:Hymn", "key:G"</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredSongs.map((song) => {
              const isFav = song.favoritedBy?.includes(currentUser.id);
              return (
                <div
                  key={song.id}
                  onClick={() => {
                    setSelectedSong(song);
                    setTargetKey("");
                  }}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedSong?.id === song.id
                      ? "bg-slate-100 border-l-4 border-black"
                      : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3
                        className={`font-medium text-sm truncate ${
                          selectedSong?.id === song.id
                            ? "text-black"
                            : "text-slate-800"
                        }`}
                      >
                        {song.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {song.artist}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {song.originalKey}
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(e, song)}
                        className={`hover:scale-110 transition-transform ${
                          isFav
                            ? "text-amber-400"
                            : "text-slate-300 hover:text-amber-300"
                        }`}
                      >
                        <Star
                          size={16}
                          fill={isFav ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {song.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => handleTagClick(tag, e)}
                        className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-200 hover:text-black hover:border-slate-300 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredSongs.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                No songs found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="hidden md:flex flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex-col overflow-hidden">
          {selectedSong ? (
            <div className="flex flex-col h-full">
              {/* Song Header */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      {selectedSong.title}
                      <button
                        onClick={(e) => toggleFavorite(e, selectedSong)}
                        className={`transition-transform hover:scale-110 ${
                          selectedSong.favoritedBy?.includes(currentUser.id)
                            ? "text-amber-400"
                            : "text-slate-300 hover:text-amber-300"
                        }`}
                      >
                        <Star
                          size={24}
                          fill={
                            selectedSong.favoritedBy?.includes(currentUser.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </h1>
                    <p className="text-slate-500 text-lg">
                      {selectedSong.artist}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(selectedSong)}
                      className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Song"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Song"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 mt-4 items-center">
                  <div className="flex items-center text-slate-600 gap-2 text-sm">
                    <Music size={16} />
                    <span>
                      Original Key: <strong>{selectedSong.originalKey}</strong>
                    </span>
                  </div>
                  <div className="flex items-center text-slate-600 gap-2 text-sm">
                    <Clock size={16} />
                    <span>
                      BPM: <strong>{selectedSong.bpm}</strong>
                    </span>
                  </div>
                  <div className="flex items-center text-slate-600 gap-2 text-sm">
                    <Hash size={16} />
                    <span>{selectedSong.timeSignature}</span>
                  </div>

                  {/* Transposition Tool */}
                  <div className="flex items-center gap-2 ml-auto bg-white border border-slate-200 rounded-lg p-1">
                    <span className="text-xs font-medium text-slate-500 px-2">
                      Key Helper:
                    </span>
                    <select
                      className="text-xs border-none bg-transparent focus:ring-0 text-slate-700 font-bold cursor-pointer"
                      value={targetKey}
                      onChange={(e) => setTargetKey(e.target.value)}
                    >
                      <option value="">Select Target</option>
                      {MUSICAL_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    {targetKey && (
                      <div className="px-3 py-1 bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center gap-1">
                        <ArrowRight size={10} /> Capo{" "}
                        {getCapoPosition(selectedSong.originalKey, targetKey) ||
                          0}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Song Content */}
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="prose prose-sm max-w-none text-slate-700">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                    Lyrics
                  </h4>
                  <div className="whitespace-pre-line font-medium leading-relaxed bg-slate-50 p-6 rounded-lg border border-slate-100 font-mono text-sm">
                    {selectedSong.lyrics || (
                      <span className="text-slate-400 italic">
                        No lyrics added.
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mt-8 mb-4">
                    Resources
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSong.youtubeLink ? (
                      <a
                        href={selectedSong.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="bg-red-50 text-red-600 p-2 rounded-full group-hover:bg-red-100">
                          <Youtube size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            Official Video
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            Watch on YouTube
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="border border-slate-100 rounded-lg p-3 flex items-center gap-3 opacity-50 select-none cursor-not-allowed">
                        <div className="bg-slate-100 text-slate-400 p-2 rounded-full">
                          <Youtube size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-400">
                            Official Video
                          </p>
                          <p className="text-xs text-slate-400">Not added</p>
                        </div>
                      </div>
                    )}

                    {selectedSong.chordChartLink ? (
                      <a
                        href={selectedSong.chordChartLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-full group-hover:bg-blue-100">
                          <FileText size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            Chord Chart
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            View Document
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="border border-slate-100 rounded-lg p-3 flex items-center gap-3 opacity-50 select-none cursor-not-allowed">
                        <div className="bg-slate-100 text-slate-400 p-2 rounded-full">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-400">
                            Chord Chart
                          </p>
                          <p className="text-xs text-slate-400">Not added</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Music size={48} className="mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-slate-600">
                Select a song
              </h3>
              <p className="text-sm mt-2 max-w-xs">
                Choose a song from the library to view details, lyrics, and
                resources.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Song Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {isEditing ? "Edit Song" : "Add New Song"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title
                  </label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Way Maker"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Artist
                  </label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    value={formData.artist}
                    onChange={(e) =>
                      setFormData({ ...formData, artist: e.target.value })
                    }
                    placeholder="e.g. Sinach"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Key
                    </label>
                    <input
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      value={formData.originalKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalKey: e.target.value,
                        })
                      }
                      placeholder="E"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      BPM
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      value={formData.bpm}
                      onChange={(e) =>
                        setFormData({ ...formData, bpm: e.target.value })
                      }
                      placeholder="68"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Time Sig
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      value={formData.timeSignature}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeSignature: e.target.value,
                        })
                      }
                    >
                      <option>4/4</option>
                      <option>3/4</option>
                      <option>6/8</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      YouTube URL
                    </label>
                    <div className="relative">
                      <Youtube
                        className="absolute left-3 top-2.5 text-slate-400"
                        size={16}
                      />
                      <input
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                        value={formData.youtubeLink}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            youtubeLink: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Chord Chart URL
                    </label>
                    <div className="relative">
                      <FileText
                        className="absolute left-3 top-2.5 text-slate-400"
                        size={16}
                      />
                      <input
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                        value={formData.chordChartLink}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            chordChartLink: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Lyrics
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 h-32 font-mono text-sm"
                    value={formData.lyrics}
                    onChange={(e) =>
                      setFormData({ ...formData, lyrics: e.target.value })
                    }
                    placeholder="Enter lyrics here..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : isEditing ? (
                      "Save Changes"
                    ) : (
                      "Create Song"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Delete Song?
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete "{selectedSong?.title}"? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
