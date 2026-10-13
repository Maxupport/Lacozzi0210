import 'dotenv/config';
import { prisma } from '../src/lib/db';

interface FBReviewItem {
  name: string;
  date: string;
  tag: string;
  stars: number;
  comment: string;
  source: string;
}

const fbReviews: FBReviewItem[] = [
  {
    name: '陳雅蕙',
    date: '2017-10-28',
    tag: '文定喜宴',
    stars: 5,
    source: 'FACEBOOK',
    comment: `非常感謝樂團的服務還有溫暖有愛的演出方式！讓我的文定喜宴在我喜歡的氣氛裡進行；也讓賓客們都留下了深刻回憶！
謝謝在籌備過程裡，Max的精闢建議還有耐心的陪總是拿捏不定的苦惱新娘討論！你的趣味與兼具文青氣息的主持風格；讓我們新人與家人的故事都融入在主持的節目裡；真的很用心！
也謝謝安立從一開始的諮詢還有相關聯繫讓我很多疑問都一一了解；謝謝妳！你的賞音我真的很喜歡；也喜歡妳那純粹、大方的笑容！so cute...
最後我要謝謝吉他手41；感謝你的歌唱演出，讓我完全收到你的心意；喜歡你的表演風格；專注、享受在當下的調性！棒…
最後我要推薦…若你們希望想要擁有一場屬於自己的獨一無二的婚宴；一定找拉釦子喔！`,
  },
  {
    name: '魏偉盛',
    date: '2018-01-27',
    tag: '一日樂團活動',
    stars: 5,
    source: 'FACEBOOK',
    comment: `感謝今天讓小女—小星星 參加你們的一日樂團，表演很棒 很喜歡 謝謝`,
  },
  {
    name: 'Dora Chiang',
    date: '2018-03-30',
    tag: '婚禮主持與樂團',
    stars: 5,
    source: 'FACEBOOK',
    comment: `感謝La Cozzi為我的婚禮注入可愛又溫暖的音樂氛圍，許多賓客都讚賞主唱老師的聲音明亮又清新～也謝謝鼓手兼婚禮主持人Max，花上許多時間與我們溝通所有流程內容，主持稿也都是依新人的故事與期望的風格下去編排，有別於外面婚禮主持的制式與千篇一律。

在此推薦，如果你也想擁有自己獨特的婚禮風格，找La Cozzi就對了:)`,
  },
  {
    name: 'Rainy Lin',
    date: '2018-06-19',
    tag: '婚禮晚宴',
    stars: 5,
    source: 'FACEBOOK',
    comment: `真的太喜歡 La Cozzi 了！！！好溝通、配合度高還很為新人著想~ 不只把指定曲詮釋的很好，還能跟親友合作表演，現場氣氛更是掌握的很好！小孩們在台上玩的開心，長輩們也稱讚連連，總而言之就是很棒`,
  },
  {
    name: 'WaHa Huang',
    date: '2018-10-31',
    tag: '婚禮推薦',
    stars: 5,
    source: 'FACEBOOK',
    comment: `很願意聽新人的建議，好可愛，清新，不俗套。喜歡～～～～～～大推`,
  },
  {
    name: '林崇倫',
    date: '2019-01-02',
    tag: '演出好評',
    stars: 5,
    source: 'FACEBOOK',
    comment: `親和力十足！熱情滿點！就算了！為什麼可以團裡鼓手吉他手都那麼會唱！太誇張了喔喔喔喔！`,
  },
  {
    name: 'Denny Han',
    date: '2019-01-04',
    tag: '婚禮主持與樂團',
    stars: 5,
    source: 'FACEBOOK',
    comment: `真心推薦拉釦子樂團！在籌備的過程中Max便不斷詢問我們對於歌曲的選擇，力求樂團演出可以貼合到我們和賓客的口味。婚宴當天Max的主持和樂團夥伴41、安立、玫吟的演出讓整場婚宴質感和氣氛向上提升很多，現場很多長輩們都表示喜歡拉釦子改編的歌。喜歡好聽不吵的音樂嗎？來找拉釦子樂團吧！！！`,
  },
  {
    name: '夫人',
    date: '2019-01-29',
    tag: '文青婚禮樂團',
    stars: 5,
    source: 'FACEBOOK',
    comment: `記得第一次找樂團的時候，當時和先生都在車上，谷歌了文青 樂團關鍵字，然後在youtu聽到了你們的聲音，當下就決定是你們了！

慶幸日期沒有卡到！在這三個月的過程裡面小編總是很仔細地跟我們溝通，樂團與先生互相錄音練習，這天終於讓自彈自唱的先生與好友們成功地在台上完成了巨星般之帥到掉渣的演出～

整場下來La Cozzi 真的是全台最耐聽又有氣質的婚禮樂團🙌
謝謝你們和我們一同共襄盛舉❤️`,
  },
  {
    name: '廖于瑄',
    date: '2019-03-16',
    tag: '證婚宴客',
    stars: 5,
    source: 'FACEBOOK',
    comment: `謝謝La Cozzi讓我們的婚禮從證婚到宴客都有很棒的音樂，也讓當天的賓客們留下深刻的印象。不論是在溝通或是曲目的安排上，樂團都會給予相關的建議，也願意配合我們準備新的表演曲目，特別是配合我們的要求，準備了保密的婚禮主題曲讓我們在婚禮前充滿期待！

樂團與主持人和飯店間的配合，讓我們節省了許多婚禮籌備上的溝通時間，真心推薦拉釦子樂團給需要音樂演出的大家~`,
  },
  {
    name: 'Tzuyu Chen',
    date: '2019-05-24',
    tag: '美式戶外婚禮',
    stars: 5,
    source: 'FACEBOOK',
    comment: `真的是緣分，在婚禮流程都還沒訂好的時候，單純只是想讓賓客在沒有節目時眼睛和耳朵不會無聊，研究好久發現La Cozzi 拉釦子樂團清新自然流行的風格，很適合我的半戶外場地+美式輕鬆的概念。

從確定下訂到婚禮當天的籌備過程中，發現這樂團能帶給你的不只是音樂，從流程到佈置都提供很棒的建議，甚至介紹專業廠商，還附加聊天喇賽紓壓的功能，總之整個過程開心又令人放心！😂`,
  },
  {
    name: '李庭柏',
    date: '2019-07-02',
    tag: '婚禮主持與樂團',
    stars: 5,
    source: 'FACEBOOK',
    comment: `感謝La Cozzi帶給我們一個特別又溫馨的婚禮！尤其要感謝Max身兼樂團打擊與主持人！我們婚禮的籌備時間很緊湊，但Max憑著經驗與創意替我們規劃了簡單又不失隆重的流程，雖然新郎本人很不負責任的在婚禮前不到兩週才決定要在婚禮上獻唱(還不在樂團提供的曲目中)，但專業的La Cozzi還是可以在短時間內配出伴奏，提供建議，並且圓滿演出！La Cozzi與Max是令人安心又放心的組合！

在典禮上La Cozzi的表演獲得賓客一致的讚賞，既能夠維持賓客的情緒，又不會太吵而喧賓奪主，我想這正是La Cozzi清新自然的風格所達到的效果！如果你想要在婚禮中有現場樂團的演出，那麼La Cozzi是你的最佳選擇；如果你還在考慮是否要有現場樂團，那是時候來敲敲La Cozzi，讓他們成為你們婚禮的一部分了！`,
  },
];

async function main() {
  console.log('🚀 開始匯入 Facebook 客戶好評...');

  // 1. 清除先前測試用的假資料
  const dummyDeleted = await prisma.review.deleteMany({
    where: {
      name: { in: ['匿名客戶', '匿名品牌'] },
    },
  });
  if (dummyDeleted.count > 0) {
    console.log(`🧹 已清理先前測試用範例假資料: ${dummyDeleted.count} 筆`);
  }

  // 2. 逐筆匯入 Facebook 評價（避免重複）
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of fbReviews) {
    const existing = await prisma.review.findFirst({
      where: {
        name: item.name,
        date: item.date,
      },
    });

    const createdAtDate = new Date(`${item.date}T12:00:00.000Z`);

    if (existing) {
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          tag: item.tag,
          stars: item.stars,
          comment: item.comment,
          source: item.source,
          status: 'APPROVED',
          createdAt: createdAtDate,
        },
      });
      updatedCount++;
      console.log(`🔄 更新已存在評價: ${item.name} (${item.date})`);
    } else {
      await prisma.review.create({
        data: {
          name: item.name,
          date: item.date,
          tag: item.tag,
          stars: item.stars,
          comment: item.comment,
          source: item.source,
          status: 'APPROVED',
          createdAt: createdAtDate,
        },
      });
      createdCount++;
      console.log(`✨ 新增評價: ${item.name} (${item.date})`);
    }
  }

  const totalReviews = await prisma.review.count();
  const approvedReviews = await prisma.review.count({ where: { status: 'APPROVED' } });

  console.log(`\n🎉 匯入完成！`);
  console.log(`- 本次新增: ${createdCount} 筆`);
  console.log(`- 本次更新: ${updatedCount} 筆`);
  console.log(`- 目前資料庫評價總數: ${totalReviews} 筆 (已核准: ${approvedReviews} 筆)`);
}

main()
  .catch((e) => {
    console.error('❌ 匯入失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
