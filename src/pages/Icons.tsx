import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import {
  IconArrowUpRight,
  // Interface
  IconHome,
  IconSearch,
  IconSettings,
  IconUser,
  IconBell,
  IconMenu2,
  IconX,
  IconChevronRight,
  IconChevronDown,
  IconDots,
  // Actions
  IconPlus,
  IconMinus,
  IconCheck,
  IconEdit,
  IconTrash,
  IconCopy,
  IconDownload,
  IconUpload,
  IconRefresh,
  IconDeviceFloppy,
  // Media
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconVolume,
  IconCamera,
  IconPhoto,
  IconMusic,
  IconMicrophone,
  // Communication
  IconMail,
  IconMessage,
  IconPhone,
  IconSend,
  IconHeart,
  IconStar,
  IconBookmark,
  IconShare,
  // Files
  IconFile,
  IconFolder,
  IconPaperclip,
  IconLink,
  IconCloud,
  IconDatabase,
  IconArchive,
  IconCode,
  // Status
  IconCircleCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconHelp,
  IconBolt,
  IconSparkles,
  IconFlame,
  IconLoader2,
} from "@tabler/icons-react"

type IconDef = { name: string; Icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }> }
type IconGroup = { title: string; icons: IconDef[] }

const GROUPS: IconGroup[] = [
  {
    title: "Interface",
    icons: [
      { name: "Home", Icon: IconHome },
      { name: "Search", Icon: IconSearch },
      { name: "Settings", Icon: IconSettings },
      { name: "User", Icon: IconUser },
      { name: "Bell", Icon: IconBell },
      { name: "Menu2", Icon: IconMenu2 },
      { name: "X", Icon: IconX },
      { name: "ChevronRight", Icon: IconChevronRight },
      { name: "ChevronDown", Icon: IconChevronDown },
      { name: "Dots", Icon: IconDots },
    ],
  },
  {
    title: "Actions",
    icons: [
      { name: "Plus", Icon: IconPlus },
      { name: "Minus", Icon: IconMinus },
      { name: "Check", Icon: IconCheck },
      { name: "Edit", Icon: IconEdit },
      { name: "Trash", Icon: IconTrash },
      { name: "Copy", Icon: IconCopy },
      { name: "Download", Icon: IconDownload },
      { name: "Upload", Icon: IconUpload },
      { name: "Refresh", Icon: IconRefresh },
      { name: "DeviceFloppy", Icon: IconDeviceFloppy },
    ],
  },
  {
    title: "Media",
    icons: [
      { name: "PlayerPlay", Icon: IconPlayerPlay },
      { name: "PlayerPause", Icon: IconPlayerPause },
      { name: "PlayerSkipForward", Icon: IconPlayerSkipForward },
      { name: "Volume", Icon: IconVolume },
      { name: "Camera", Icon: IconCamera },
      { name: "Photo", Icon: IconPhoto },
      { name: "Music", Icon: IconMusic },
      { name: "Microphone", Icon: IconMicrophone },
    ],
  },
  {
    title: "Communication",
    icons: [
      { name: "Mail", Icon: IconMail },
      { name: "Message", Icon: IconMessage },
      { name: "Phone", Icon: IconPhone },
      { name: "Send", Icon: IconSend },
      { name: "Heart", Icon: IconHeart },
      { name: "Star", Icon: IconStar },
      { name: "Bookmark", Icon: IconBookmark },
      { name: "Share", Icon: IconShare },
    ],
  },
  {
    title: "Files & data",
    icons: [
      { name: "File", Icon: IconFile },
      { name: "Folder", Icon: IconFolder },
      { name: "Paperclip", Icon: IconPaperclip },
      { name: "Link", Icon: IconLink },
      { name: "Cloud", Icon: IconCloud },
      { name: "Database", Icon: IconDatabase },
      { name: "Archive", Icon: IconArchive },
      { name: "Code", Icon: IconCode },
    ],
  },
  {
    title: "Status & feedback",
    icons: [
      { name: "CircleCheck", Icon: IconCircleCheck },
      { name: "AlertTriangle", Icon: IconAlertTriangle },
      { name: "InfoCircle", Icon: IconInfoCircle },
      { name: "Help", Icon: IconHelp },
      { name: "Bolt", Icon: IconBolt },
      { name: "Sparkles", Icon: IconSparkles },
      { name: "Flame", Icon: IconFlame },
      { name: "Loader2", Icon: IconLoader2 },
    ],
  },
]

export function Icons() {
  return (
    <div className="min-h-svh bg-surface text-label">
      <PageShell className="space-y-0! flex flex-col gap-stack-l">
        <header className="flex items-start justify-between gap-inline-m">
          <div className="max-w-xl">
            <PageHeader
              title="Icons"
              description="Tabler Icons — 5,400+ outline + filled icons on a consistent 2px / 24px grid. Import directly from @tabler/icons-react and size them with the size prop."
            />
          </div>
          <a
            href="https://tabler.io/icons"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 h-8 px-inset-xs rounded-md text-sm text-label-secondary hover:text-label hover:bg-fill-quaternary transition-colors"
          >
            Browse all <IconArrowUpRight size={14} stroke={2} />
          </a>
        </header>

        {GROUPS.map((group) => (
          <Section key={group.title} title={group.title} bare>
            <div className="grid grid-cols-2 gap-gutter-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {group.icons.map(({ name, Icon }) => (
                <div
                  key={name}
                  className="flex items-center gap-inline-xs rounded-xl bg-surface-secondary p-inset-xs inset-ring-1 inset-ring-stroke-faint"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-fill-quaternary text-label">
                    <Icon size={28} stroke={1.75} />
                  </div>
                  <span className="font-mono text-xs text-label-secondary truncate">
                    Icon{name}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        ))}
      </PageShell>
    </div>
  )
}
