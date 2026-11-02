export interface UserProfile {
  name: string;
  phone?: string;
  email?: string;
  avatarColor?: string; // e.g. "from-sky-600 to-cyan-500"
  bio?: string;
  createdAt: string;
  updatedAt: string;
  isCloudSynced?: boolean;
}

export const AVATAR_COLOR_PRESETS = [
  { id: "sky", label: "Sky Cyan", gradient: "from-sky-600 to-cyan-500", border: "border-sky-300", bgLight: "bg-sky-50 text-sky-700" },
  { id: "indigo", label: "Indigo Violet", gradient: "from-indigo-600 to-violet-500", border: "border-indigo-300", bgLight: "bg-indigo-50 text-indigo-700" },
  { id: "emerald", label: "Emerald Teal", gradient: "from-emerald-600 to-teal-500", border: "border-emerald-300", bgLight: "bg-emerald-50 text-emerald-700" },
  { id: "amber", label: "Amber Orange", gradient: "from-amber-500 to-orange-500", border: "border-amber-300", bgLight: "bg-amber-50 text-amber-700" },
  { id: "rose", label: "Rose Pink", gradient: "from-rose-600 to-pink-500", border: "border-rose-300", bgLight: "bg-rose-50 text-rose-700" },
  { id: "purple", label: "Purple Fuchsia", gradient: "from-purple-600 to-fuchsia-500", border: "border-purple-300", bgLight: "bg-purple-50 text-purple-700" },
];
