import VideosPage from "@/components/VideosPage";

export const metadata = {
  title: "演出影音 | La Cozzi 拉釦子樂團",
  description: "聆聽 La Cozzi 拉釦子樂團現場手作音樂演奏精選，婚禮與活動現場真實收音，感受最有溫度的音符流動。",
};

export default function Page() {
  const playlistId = process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID;
  return <VideosPage playlistId={playlistId} />;
}
