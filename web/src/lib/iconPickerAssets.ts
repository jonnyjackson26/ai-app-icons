// Curated set of Lucide icons offered in the picker. Imports are explicit so
// the bundler tree-shakes the unused ~2k icons. Categories are display-only.

import {
  // general / ui
  Home, Search, Settings, User, Bell, Heart, Star, Bookmark, Mail, Phone,
  Calendar, Clock, Globe, Lock, Key, Shield, Gift, Flag, Tag, Compass,
  Eye, Map, MapPin, Hash, AtSign, Smile, ThumbsUp, Sparkles, Lightbulb, Award,
  // media / creative
  Play, Music, Camera, Image, Video, Mic, Headphones, Film, Palette, Brush,
  Aperture, Disc, Radio,
  // tech / dev
  Code, Code2, Terminal, Cpu, Database, Cloud, Wifi, Server, HardDrive, Zap,
  Bot, Brain, Gamepad2, Bug, GitBranch,
  // communication / social
  MessageCircle, MessageSquare, Send, Share2, Users, Mailbox,
  // commerce / money
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Wallet, Receipt, Percent,
  Banknote, PiggyBank, TrendingUp,
  // productivity
  Briefcase, FileText, Folder, ClipboardList, Pencil, CheckCircle, ListTodo,
  BookOpen, Notebook, Inbox,
  // health / fitness
  Activity, Dumbbell, Pill, Stethoscope, Apple, Salad, Carrot, HeartPulse,
  // travel / nature
  Plane, Car, Bus, Ship, Bike, Anchor, Mountain, TreePine, Tent, Sun, Moon,
  Snowflake, Flame, Leaf, Trees, Flower, Waves, Umbrella, Rainbow,
  // food / drink
  Coffee, Pizza, Cake, IceCream, Wine, Beer, Utensils, Soup, CookingPot,
  // animals
  Cat, Dog, Bird, Fish, PawPrint, Rabbit,
  // misc
  Rocket, Trophy, Crown, Gem, Target, Puzzle, Wand2, Diamond,
} from "lucide-react";

import type { ComponentType, SVGProps } from "react";

// Match Lucide's actual exported component shape. Using a permissive
// SVGProps-based signature to absorb version drift in lucide-react's
// LucideProps generic between releases.
export type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }
>;

export interface PickableIcon {
  name: string;
  Component: IconComponent;
  keywords?: string;
}

export interface IconCategory {
  name: string;
  icons: PickableIcon[];
}

const k = (name: string, Component: IconComponent, keywords?: string): PickableIcon => ({
  name,
  Component,
  keywords,
});

export const ICON_CATEGORIES: IconCategory[] = [
  {
    name: "Popular",
    icons: [
      k("Heart", Heart, "love favorite"),
      k("Star", Star, "favorite rating"),
      k("Sparkles", Sparkles, "magic shine"),
      k("Rocket", Rocket, "launch startup"),
      k("Zap", Zap, "lightning fast"),
      k("Crown", Crown, "premium king"),
      k("Trophy", Trophy, "win award"),
      k("Gem", Gem, "diamond jewel"),
      k("Bot", Bot, "ai robot"),
      k("Brain", Brain, "ai mind think"),
      k("Wand2", Wand2, "magic"),
      k("Lightbulb", Lightbulb, "idea"),
    ],
  },
  {
    name: "General",
    icons: [
      k("Home", Home), k("Search", Search), k("Settings", Settings),
      k("User", User), k("Bell", Bell), k("Bookmark", Bookmark),
      k("Mail", Mail), k("Phone", Phone), k("Calendar", Calendar),
      k("Clock", Clock), k("Globe", Globe), k("Lock", Lock),
      k("Key", Key), k("Shield", Shield), k("Gift", Gift),
      k("Flag", Flag), k("Tag", Tag), k("Compass", Compass),
      k("Eye", Eye), k("Map", Map), k("MapPin", MapPin),
      k("Hash", Hash), k("AtSign", AtSign), k("Smile", Smile),
      k("ThumbsUp", ThumbsUp), k("Award", Award), k("Diamond", Diamond),
    ],
  },
  {
    name: "Media",
    icons: [
      k("Play", Play), k("Music", Music), k("Camera", Camera),
      k("Image", Image), k("Video", Video), k("Mic", Mic),
      k("Headphones", Headphones), k("Film", Film), k("Palette", Palette),
      k("Brush", Brush), k("Aperture", Aperture), k("Disc", Disc),
      k("Radio", Radio),
    ],
  },
  {
    name: "Tech",
    icons: [
      k("Code", Code), k("Code2", Code2), k("Terminal", Terminal),
      k("Cpu", Cpu), k("Database", Database), k("Cloud", Cloud),
      k("Wifi", Wifi), k("Server", Server), k("HardDrive", HardDrive),
      k("Gamepad2", Gamepad2), k("Bug", Bug), k("GitBranch", GitBranch),
    ],
  },
  {
    name: "Social",
    icons: [
      k("MessageCircle", MessageCircle), k("MessageSquare", MessageSquare),
      k("Send", Send), k("Share2", Share2), k("Users", Users),
      k("Mailbox", Mailbox),
    ],
  },
  {
    name: "Money",
    icons: [
      k("ShoppingCart", ShoppingCart), k("ShoppingBag", ShoppingBag),
      k("CreditCard", CreditCard), k("DollarSign", DollarSign),
      k("Wallet", Wallet), k("Receipt", Receipt), k("Percent", Percent),
      k("Banknote", Banknote), k("PiggyBank", PiggyBank), k("TrendingUp", TrendingUp),
    ],
  },
  {
    name: "Work",
    icons: [
      k("Briefcase", Briefcase), k("FileText", FileText), k("Folder", Folder),
      k("ClipboardList", ClipboardList), k("Pencil", Pencil),
      k("CheckCircle", CheckCircle), k("ListTodo", ListTodo),
      k("BookOpen", BookOpen), k("Notebook", Notebook), k("Inbox", Inbox),
    ],
  },
  {
    name: "Health",
    icons: [
      k("Activity", Activity), k("Dumbbell", Dumbbell), k("Pill", Pill),
      k("Stethoscope", Stethoscope), k("Apple", Apple), k("Salad", Salad),
      k("Carrot", Carrot), k("HeartPulse", HeartPulse),
    ],
  },
  {
    name: "Travel",
    icons: [
      k("Plane", Plane), k("Car", Car), k("Bus", Bus), k("Ship", Ship),
      k("Bike", Bike), k("Anchor", Anchor), k("Mountain", Mountain),
      k("TreePine", TreePine), k("Tent", Tent),
    ],
  },
  {
    name: "Nature",
    icons: [
      k("Sun", Sun), k("Moon", Moon), k("Snowflake", Snowflake),
      k("Flame", Flame), k("Leaf", Leaf), k("Trees", Trees),
      k("Flower", Flower), k("Waves", Waves), k("Umbrella", Umbrella),
      k("Rainbow", Rainbow),
    ],
  },
  {
    name: "Food",
    icons: [
      k("Coffee", Coffee), k("Pizza", Pizza), k("Cake", Cake),
      k("IceCream", IceCream), k("Wine", Wine), k("Beer", Beer),
      k("Utensils", Utensils), k("Soup", Soup), k("CookingPot", CookingPot),
    ],
  },
  {
    name: "Animals",
    icons: [
      k("Cat", Cat), k("Dog", Dog), k("Bird", Bird),
      k("Fish", Fish), k("PawPrint", PawPrint), k("Rabbit", Rabbit),
      k("Puzzle", Puzzle), k("Target", Target),
    ],
  },
];

// Flat lookup for keyword search across all categories.
export const ALL_ICONS: PickableIcon[] = ICON_CATEGORIES.flatMap((c) => c.icons);

// ---------------------------------------------------------------------------
// Emojis
// ---------------------------------------------------------------------------

export interface EmojiCategory {
  name: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: "Smileys",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
      "🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬",
      "🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸",
      "😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱",
      "😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻",
      "👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
    ],
  },
  {
    name: "Hands & People",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍",
      "👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁",
      "🦷","🦴","👀","👁️","👅","👄","💋","💘","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕",
      "💞","💓","💗","💖","💝","💟",
    ],
  },
  {
    name: "Animals",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊",
      "🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌",
      "🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀",
      "🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘",
      "🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈","🦤","🦚","🦜","🦢","🦩","🕊️",
      "🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🪴",
      "🌱","🌿","☘️","🍀","🎍","🎋","🍃","🍂","🍁","🍄","🐚","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻",
    ],
  },
  {
    name: "Food & Drink",
    emojis: [
      "🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦",
      "🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈",
      "🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕",
      "🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨",
      "🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","☕","🫖","🍵",
      "🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾",
    ],
  },
  {
    name: "Activities",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳",
      "🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🎿","⛷️","🏂","🪂","🏋️","🤺","🤾","🏌️","🏇",
      "🧘","🏄","🏊","🤽","🚣","🏃","🚴","🚵","🎽","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪",
      "🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🪘","🎲","🎯","🎳","🎮",
      "🎰","🧩",
    ],
  },
  {
    name: "Travel & Places",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲","🛵",
      "🏍️","🛺","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇",
      "🚊","🚉","✈️","🛫","🛬","🛩️","💺","🛰️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","⚓","🪝",
      "⛽","🚏","🚦","🚥","🗺️","🗿","🗽","🗼","🏰","🏯","🏟️","🎡","🎢","🎠","⛲","⛱️","🏖️","🏝️","🏜️","🌋",
      "⛰️","🏔️","🗻","🏕️","⛺","🏠","🏡","🏘️","🏚️","🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫",
      "🏩","💒","🏛️","⛪","🕌","🛕","🕍","⛩️",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🕹️","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽️","🎞️",
      "📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🔌","💡",
      "🔦","🕯️","🧯","🛢️","💸","💵","💰","💳","💎","⚖️","🧰","🔧","🔨","⚒️","🛠️","⛏️","🔩","⚙️","🧲","🧱",
      "⛓️","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️","🚬","⚰️","⚱️","🏺","🔮","📿","🧿","💈","⚗️","🔭","🔬",
      "🩹","🩺","💊","💉","🧬","🦠","🌡️","🧹","🧺","🧻","🚽","🚿","🛁","🧼","🧽","🛎️","🔑","🗝️","🚪","🛋️",
      "🛏️","🧸","🖼️","🛍️","🛒","🎁","🎈","🎏","🎀","🎊","🎉","🎎","🏮","🎐","🧧","✉️","📩","📨","📧","💌",
      "📦","🏷️","📮","📜","📃","📄","📑","🧾","📊","📈","📉","🗒️","🗓️","📆","📅","📋","📁","📂","🗂️","🗞️",
      "📰","📓","📔","📒","📕","📗","📘","📙","📚","📖","🔖","🧷","🔗","📐","📏","🧮","📌","📍","✂️","🖊️",
      "✏️","🔍","🔐","🔒",
    ],
  },
  {
    name: "Symbols",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️",
      "⚛️","🆔","☢️","☣️","✴️","🆚","💮","🉐","㊙️","㊗️","🅰️","🅱️","🆎","🅾️","❌","⭕","🛑","⛔","📛","🚫",
      "💯","💢","♨️","🚷","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸",
      "🔱","⚜️","🔰","♻️","✅","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🚹","🚺",
      "🚼","🚻","🎦","📶","🔣","ℹ️","🔤","🔡","🔠","🆖","🆗","🆙","🆒","🆕","🆓","▶️","⏸️","⏯️","⏹️","⏺️",
      "⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","🔀",
      "🔁","🔂","🔄","🔃","🎵","🎶","➕","➖","➗","✖️","♾️","💲","💱","™️","©️","®️","➰","➿","🔚","🔙",
      "🔛","🔝","🔜","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔸","🔹","🔶",
      "🔷","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫","🔔","🔕","♠️","♣️","♥️","♦️","🃏","🎴","🀄",
    ],
  },
];

export const ALL_EMOJIS: string[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
