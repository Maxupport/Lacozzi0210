import ReviewsPage from "@/components/ReviewsPage";
import { getApprovedReviews } from "@/lib/content";

export const revalidate = 60;

export const metadata = {
  title: "客戶好評 | La Cozzi 拉釦子樂團",
  description: "每一份感謝與回饋，都是對 La Cozzi 最大的肯定與動力。",
};

export default async function Page() {
  const reviews = await getApprovedReviews();
  return <ReviewsPage initialReviews={reviews} />;
}
