/* ==========================================================
   顺德寻味地图 · 数据层
   数据来源：B站/抖音探店内容 + 佛山发布「容马必打卡」清单 +
            顺德本地美食攻略交叉核对（2026-10）
   坐标说明：为店铺所在街区的近似位置（GCJ-02 近似），
             导航按钮统一走高德关键词搜索，避免坐标误差带偏。
   视频说明：videos 中 verified:true 为已核实真实链接；
             其余为「搜索直达」链接，点击后由平台返回最新结果，
             不编造不存在的视频地址。
   ========================================================== */

const CATEGORIES = [
  { id: 'all',      name: '全部',      color: '#B33A2B' },
  { id: 'dessert',  name: '甜品奶品',  color: '#D97706' },
  { id: 'roast',    name: '烧腊',      color: '#B91C1C' },
  { id: 'beef',     name: '牛杂',      color: '#7C3AED' },
  { id: 'fish',     name: '鱼生',      color: '#0891B2' },
  { id: 'rice',     name: '煲仔饭',    color: '#92400E' },
  { id: 'private',  name: '私房菜',    color: '#BE123C' },
  { id: 'noodle',   name: '粉面',      color: '#65A30D' },
  { id: 'snack',    name: '街头小吃',  color: '#DB2777' },
  { id: 'steam',    name: '干蒸排骨',  color: '#A16207' },
  { id: 'tea',      name: '早茶',      color: '#CA8A04' },
  { id: 'farm',     name: '特色菜',    color: '#15803D' }
];

const AREAS = ['大良', '容桂', '伦教', '勒流', '陈村', '杏坛'];

/* 已核实的博主信源 —— 只放真链接，别的不硬编 */
const SOURCES = [
  {
    platform: 'bilibili',
    title: '美国人敢吃顺德鱼生吗？一鱼五吃，广东全鱼宴挑战',
    url: 'https://www.bilibili.com/video/BV1MLiXBSEkh',
    note: '整条鱼拆成五道菜，现场学捞起，跟刺身做对比'
  },
  {
    platform: 'bilibili',
    title: '大兵饿了 / 大兵探店 · 合集「佛山顺德探店」',
    url: 'https://space.bilibili.com/477273422/lists?sid=252862',
    note: '45 条顺德专题，烧鹅性价比、14 元排骨饭、第一鱼生都在这'
  },
  {
    platform: 'bilibili',
    title: '顺德老baby_ · 顺德家庭做法',
    url: 'https://space.bilibili.com/1116529587',
    note: '74 岁老豆下厨，清水打边炉、桑拿菜、鸡有鸡味的源头解法'
  }
];

/* ==========================================================
   博主档案
   covered: true  = 已核到确有顺德探店内容，下面 SHOPS 里有对应店
   covered: false = 检索过但没有顺德探店记录（或未具名），不硬凑
   ========================================================== */
const CREATORS = [
  {
    id: 'liuyuxin',
    name: '刘雨鑫JASON',
    platform: 'douyin',
    platformName: '抖音',
    role: '千万粉 · 现象级引爆者',
    note: '央广电台主持出身，走遍四十多个国家，打卡过六千多家餐厅。专挑居民区、菜市场旁的小店，不拍桌子不瞪眼，平静讲这菜什么来头。',
    highlight: '2026-03-25 探陈村绀现村莫氏鸡煲，老板一句「回头你搞得太好，我做不了啊」引爆全网，单条曝光超 1.5 亿，把整个村带火。',
    url: 'https://www.douyin.com/search/%E5%88%98%E9%9B%A8%E9%91%ABJASON%20%E9%A1%BA%E5%BE%B7',
    covered: true
  },
  {
    id: 'tangsui',
    name: '特厨隋坡',
    platform: 'bilibili',
    platformName: 'B站',
    role: '国宴大师弟子 · 特级厨师',
    note: '本名隋坡，国宴大师郑秀生的徒弟，曾任多家五星级酒店行政主厨。评价从火候和工艺拆，不是纯口味吐槽。',
    highlight: '顺德合集 4 家：水仙头私房菜、香江饭店、顺峰烧鸡、蒸四味。',
    url: 'https://space.bilibili.com/3546888255048212/channel/collectiondetail?sid=8235552',
    covered: true
  },
  {
    id: 'tangrenjie',
    name: '真探唐仁杰',
    platform: 'bilibili',
    platformName: 'B站',
    role: '科班厨子 · 敢说',
    note: '主页自述「学的川菜干的粤菜，原喜来登西餐厨师长」，开场白「探店齁币多，真假厨子说」。吃一道菜能拆出该用什么料、哪一步出了问题。',
    highlight: '探过牛展煲仔饭（¥221）与顺德大门公（¥838）。',
    url: 'https://space.bilibili.com/544336675',
    covered: true
  },
  {
    id: 'pinchengji',
    name: '品城记Video',
    platform: 'bilibili',
    platformName: 'B站',
    role: '广东本地探店团队',
    note: '「品一座城，不仅仅是美食，更是人文」。顺德合集 11 条，是本地视角最扎实的一路。',
    highlight: '探过桥珠印象·鱼生私房菜、烧鹅再·传统顺德菜，还有那家「200 块一只鸡、150 块一条鱼、嫌贵可以去别处吃」的争议私房菜。',
    url: 'https://space.bilibili.com/35364728',
    covered: true
  },
  {
    id: 'dage',
    name: '达哥在上海',
    platform: 'douyin',
    platformName: '抖音',
    role: '全国跑 · 真实食客视角',
    note: '上海起家，跑遍全国的街头小馆与大排档，不修饰、不点评术语，就是普通食客吃给你看。',
    highlight: '2026-10-06 顺德一趟：两家烧鹅（109 元 1/4 下庄、146 元 1/4 左腿+半斤叉烧）加一家居民楼里的老牌鱼生店，一鱼四吃 173 元，三人共 428 元。',
    url: 'https://www.douyin.com/search/%E8%BE%BE%E5%93%A5%E5%9C%A8%E4%B8%8A%E6%B5%B7%20%E9%A1%BA%E5%BE%B7',
    covered: true,
    unnamed: true
  },
  {
    id: 'dabing',
    name: '大兵饿了',
    alias: 'B站 · 快手：大兵探店',
    platform: 'bilibili',
    platformName: 'B站',
    role: '顺德专题 45 条',
    note: '抖音主号叫「大兵饿了」，B站和快手上叫「大兵探店」（快手词条另记作「吃货大兵」）。两边视频标题多处一字不差，按同一批内容多平台分发理解。',
    highlight: 'B站号最早投稿 2022-03-03。「佛山顺德探店」合集 45 条，集中在 2022 年 9 月底—10 月初，2026 年仍在更顺德合集。注意：B站写的是 623 投稿，抖音词条写约 200 作品，数量对不上，所以「同一人」这条只能算高度可能，不能算确证。',
    url: 'https://space.bilibili.com/477273422/lists?sid=252862',
    covered: true
  },
  {
    id: 'ershi',
    name: '二百者也',
    platform: 'douyin',
    platformName: '抖音',
    role: '200 元开盲盒 · 千万粉',
    note: '「200 元饭店开盲盒，店家上啥我吃啥」，固定红卫衣、结尾晒小票，坚决足额付款不占商家便宜。',
    highlight: '检索过，但没有找到在顺德开盲盒的具体店名记录，暂不挂店。',
    url: 'https://www.douyin.com/search/%E4%BA%8C%E7%99%BE%E8%80%85%E4%B9%9F%20%E9%A1%BA%E5%BE%B7',
    covered: false,
    reason: '未检索到顺德探店记录'
  },
  {
    id: 'pangshi',
    name: '庞师不是师',
    platform: 'douyin',
    platformName: '抖音',
    role: '有文采 · 段子随口来',
    note: '擅长情景演绎和边聊边吃，挑馆子信条是「越不起眼的老破店越有惊喜」。',
    highlight: '顺德探过 4 家：容边排骨饭、烧鹅再、容里煲仔饭、猪肉婆。这几家是用户口述补充的——公开检索没查到对应视频，具体链接待补，点按钮走平台搜索。',
    url: 'https://search.bilibili.com/all?keyword=%E5%BA%9E%E5%B8%88%E4%B8%8D%E6%98%AF%E5%B8%88%20%E9%A1%BA%E5%BE%B7',
    covered: true,
    pending: true
  },
  {
    id: 'yewen',
    name: '野文不懂吃',
    platform: 'douyin',
    platformName: '抖音',
    role: '街头小店向',
    note: '主打街边小馆和本地人饭点，内容偏日常。',
    highlight: '顺德探过 4 家：公司排骨饭、大围公早餐、欣欣饭堂、润记宵夜。店名由用户口述补充，公开检索没查到对应视频，具体链接待补。',
    url: 'https://search.bilibili.com/all?keyword=%E9%87%8E%E6%96%87%E4%B8%8D%E6%87%82%E5%90%83%20%E9%A1%BA%E5%BE%B7',
    covered: true,
    pending: true
  }
];

const SHOPS = [
  {
    id: 'minxin',
    name: '民信老铺（华盖路店）',
    area: '大良',
    cat: 'dessert',
    addr: '大良街道华盖路 119 号',
    price: '¥20–30',
    sig: ['半糖双皮奶（冷）', '炸牛奶', '椰子炖奶'],
    desc: '1925 年董孝华开的双皮奶源头店，三楼还有个双皮奶博物馆。半糖冷双皮奶是公认最稳的一碗，奶皮结得厚，勺子敲开像冰淇淋脆壳。伴手礼玻璃瓶带 logo，路上不怕晃。',
    tip: '08:00–23:30，工作日上午去，节假日排到门口',
    lat: 22.8412, lng: 113.2921,
    kw: '民信老铺 华盖路'
  },
  {
    id: 'renxin',
    name: '仁信老铺（清晖店）',
    area: '大良',
    cat: 'dessert',
    addr: '大良街道百岁流芳 18 号翠怡阁 8 号铺',
    price: '¥23',
    sig: ['红豆双皮奶', '姜撞奶', '牛奶卷'],
    desc: '跟民信本是一家，姐弟分家各撑一杆旗。口感比民信轻盈，甜度收得克制，冰的更顺口。逛完清晖园走几步就到，是最省事的一家。',
    tip: '09:00–21:00 / 0757-28888321，老城车位紧，建议打车',
    lat: 22.8396, lng: 113.2951,
    kw: '仁信老铺 清晖店 大良'
  },
  {
    id: 'huanji',
    name: '金榜欢记牛乳',
    area: '大良',
    cat: 'dessert',
    addr: '大良金榜上街 19 号',
    price: '¥12–25',
    sig: ['冻双皮奶', '水牛奶', '金榜牛乳片'],
    desc: '上过央视《寻味顺德》的老店，铺子小到只有几张桌。水牛奶是当天的，卖完就收。老板会叮嘱你「不下厨房就别买牛乳片」，怕糟蹋手工。',
    tip: '17:00 后基本靠缘分，牛乳片可顺丰寄回家',
    lat: 22.8456, lng: 113.2879,
    kw: '金榜欢记牛乳 大良'
  },
  {
    id: 'tidi',
    name: '金榜梯底牛乳铺',
    area: '大良',
    cat: 'dessert',
    addr: '大良金榜美食街',
    price: '¥15–20',
    sig: ['双皮奶', '炸牛奶', '野鸡卷'],
    desc: '央视力推的百年水牛奶工艺，双皮奶入口即化、甜度适中不齁。金榜这条街整条都是牛乳店，走到哪家都不至于踩雷，但这家是排队最狠的之一。',
    tip: '周末人挤人，上午 10 点前到，顺手打卡凤城鱼皮',
    lat: 22.8462, lng: 113.2868,
    kw: '金榜梯底牛乳铺'
  },
  {
    id: 'asan',
    name: '阿三麻蓉汤圆',
    area: '大良',
    cat: 'dessert',
    addr: '大良街道（华盖路商圈）',
    price: '¥15',
    sig: ['双皮奶汤圆', '芝麻/花生汤圆'],
    desc: '外表朴素得像个杂货铺，端上来是六颗糯叽叽的汤圆坐在一碗金黄流油的双皮奶上。咬开又沙又香，配一口奶一起送进去，是双皮奶测评里最出圈的一家。',
    tip: '黑芝麻和花生两种馅，建议各来一半',
    lat: 22.8401, lng: 113.2936,
    kw: '阿三麻蓉汤圆 大良'
  },
  {
    id: 'ximei',
    name: '细妹五香牛杂',
    area: '大良',
    cat: 'beef',
    addr: '大良街道马地巷 2 号',
    price: '¥30',
    sig: ['萝卜牛杂', '豆腐卜', '鱼蛋'],
    desc: '40 年夫妻店，华盖路常年排队王。牛杂处理得干净没异味，秘制五香卤焖足 4 小时，软烂入味带点微辣，萝卜吸饱了药膳卤汁才是精华。小份就够解馋。',
    tip: '只收现金的概率不小，备点零钱',
    lat: 22.8426, lng: 113.2906,
    kw: '细妹五香牛杂 马地巷'
  },
  {
    id: 'lanjie',
    name: '兰姐牛杂店（容新路店）',
    area: '容桂',
    cat: 'beef',
    addr: '容桂北边街与容新路交叉口东 50 米',
    price: '¥25',
    sig: ['猪骨汤底牛杂', '麻辣烫'],
    desc: '把麻辣烫做到极致的那种街边店——汤底用猪骨枸杞熬足 5 个钟，芝麻、酸笋、葱花、香菜、姜片、酸菜、辣椒一层层往上堆。容桂人自己的深夜食堂。',
    tip: '晚上去才热闹，白天是给街坊的',
    lat: 22.7812, lng: 113.2881,
    kw: '兰姐牛杂店 容新路 容桂'
  },
  {
    id: 'pingjie',
    name: '萍姐牛杂',
    area: '容桂',
    cat: 'beef',
    addr: '容桂振南路宏俊广场旁',
    price: '¥20',
    sig: ['牛杂拼盘', '豆腐卜'],
    desc: '巷子里的玻璃瓶可乐回忆杀，容桂人从小吃到大。牛肚牛肠软烂入味，油炸豆腐泡浸满牛杂汁，一口爆浆，人均 20 块吃到扶墙。',
    tip: '11:30–23:00，夜宵党福音',
    lat: 22.7756, lng: 113.2861,
    kw: '萍姐牛杂 容桂'
  },
  {
    id: 'huangliandatouhua',
    name: '黄连大头华烧鹅',
    area: '勒流',
    cat: 'roast',
    addr: '勒流街道黄连村（黄连大头华）',
    price: '¥55',
    sig: ['脆皮烧鹅', '卤水鹅什', '肥叉'],
    desc: '开了三十多年的黄连烧鹅，广东烧鹅的天花板之一。皮脆得像在嚼玻璃纸，鹅肉一咬淌汁，皮肉之间一层薄油香而不腻。蘸自制梅子酱，酸甜解腻。卤水那锅跟店一样老。',
    tip: '出炉时间 11:30 / 16:30，赶不上这两拨就别去了',
    lat: 22.8582, lng: 113.1779,
    kw: '黄连大头华烧鹅'
  },
  {
    id: 'dadi',
    name: '大地醉鹅',
    area: '大良',
    cat: 'roast',
    addr: '大良街道',
    price: '¥55',
    sig: ['醉鹅', '鹅汁拌饭'],
    desc: '1998 年开的凤城老字号。醉鹅酱汁浓、酒香刚好不冲，鹅肉炖得紧实入味，最后那勺酱汁拌饭能干三碗——这是本地人给的评价，不是营销话术。',
    tip: '两人来点半只就够，留肚子给甜品',
    lat: 22.8348, lng: 113.2902,
    kw: '大地醉鹅 大良'
  },
  {
    id: 'zhuroupo',
    name: '猪肉婆私房菜',
    area: '容桂',
    cat: 'private',
    addr: '容桂街道细滘展业路 31 号',
    price: '¥120',
    sig: ['顺德鱼生', '盐水鸡', '干煎美极罗氏虾', '银杏猪肚汤'],
    desc: '顺德美食名片，2016 年上过《寻味顺德》。庭院古色古香，接得住整个顺德的游客流量还不出错，上菜快且稳。鱼生薄如纸片配十几种料捞匀，一鱼四吃性价比反而高。',
    tip: '旺季提前一天订位，电话高德上就有',
    lat: 22.7712, lng: 113.2762,
    kw: '猪肉婆私房菜 容桂',
    visited: [
      { name: '庞师不是师', cid: 'pangshi', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E5%BA%9E%E5%B8%88%E4%B8%8D%E6%98%AF%E5%B8%88%20%E7%8C%AA%E8%82%89%E5%A9%86' }
    ]
  },
  {
    id: 'weikedaoo',
    name: '味可道美食坊',
    area: '容桂',
    cat: 'private',
    addr: '容桂街道福基路 1 号',
    price: '¥90',
    sig: ['酥皮水牛奶挞', '妈姐靓汤', '黑松露焗鸡'],
    desc: '2010 年开的岭南菜私房，口号是「传承不守旧，创新不忘本」。最出圈的是酥皮水牛奶挞——把双皮奶塞进蛋挞壳，两种顺德招牌一次吃掉。',
    tip: '水牛奶挞出炉有限量，早茶时段去最稳',
    lat: 22.7801, lng: 113.2852,
    kw: '味可道美食坊 容桂'
  },
  {
    id: 'huangdanji',
    name: '黄但记（陈村店）',
    area: '陈村',
    cat: 'noodle',
    addr: '陈村镇',
    price: '¥45',
    sig: ['猪肚陈村粉', '排骨陈村粉', '椒盐鱼骨', 'XO 酱炒陈村粉'],
    desc: '1927 年创立，陈村粉的发源地，非遗老店。米浆石磨现磨，粉皮薄到半毫米、透光，比肠粉更韧、米香更浓。椒盐鱼骨是隐藏王牌，鲜到舔盘。',
    tip: '中午正餐时段去，晚了粉卖完',
    lat: 22.9800, lng: 113.1650,
    kw: '黄但记 陈村'
  },
  {
    id: 'huanjie',
    name: '欢姐伦教糕（伦教总店）',
    area: '伦教',
    cat: 'snack',
    addr: '伦教街道北海大道北 50 号',
    price: '¥18',
    sig: ['伦教糕', '钵仔糕'],
    desc: '百年非遗，「岭南第一糕」。伦教糕只用稻米和蔗糖，气孔排列细密整齐，松软又有弹劲，带一点发酵的微酸——不爱吃甜的人反而能连吃好几块。',
    tip: '买几盒当伴手礼，比景区特产靠谱得多',
    lat: 22.8770, lng: 113.2180,
    kw: '欢姐伦教糕 伦教'
  },
  {
    id: 'rongbian',
    name: '容边排骨饭',
    area: '容桂',
    cat: 'steam',
    addr: '容桂街道容边天河路 7 号',
    price: '¥44',
    sig: ['干蒸排骨饭', '啫啫牛肉煲'],
    desc: '干蒸排骨这门手艺的代表老店，三十多年了。凌晨 4:30 开门、下午 1:30 收摊。排骨不加一滴水，全靠自身油脂和铁锅猛火干逼，上桌滋滋冒油，酱汁咸香，一碟 14 块米饭还能无限续。没有环境没有服务，但香到排队排到街口。',
    tip: '认准天河路 7 号，别走错同名店；7 点前到避开上班族。三家直营店不开放加盟，大良三店离清晖园最近，游客最方便',
    lat: 22.7831, lng: 113.2871,
    kw: '容边排骨饭 干蒸排骨 天河路 容桂',
    featured: '干蒸排骨代表店',
    visited: [
      { name: '大兵饿了', cid: 'dabing', platform: 'bilibili', note: '2022-10-02《顺德人气最火爆的排骨饭，14元一份藏于城中村》，性价比讲得最细', url: 'https://www.bilibili.com/video/BV1kT411K7a4' },
      { name: '庞师不是师', cid: 'pangshi', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E5%BA%9E%E5%B8%88%E4%B8%8D%E6%98%AF%E5%B8%88%20%E5%AE%B9%E8%BE%B9%E6%8E%92%E9%AA%A8%E9%A5%AD' }
    ]
  },
  {
    id: 'hongxing',
    name: '红星光发煲仔饭（总店）',
    area: '容桂',
    cat: 'rice',
    addr: '容桂街道大石街 40 号',
    price: '¥45',
    sig: ['金牌黄鳝煲仔饭', '腊味金蚝粒肠饭', '窝蛋牛肉饭'],
    desc: '30 多款煲仔饭的本地人饭堂，米饭粒粒金香，饭焦脆口金黄。黄鳝那份是招牌，鳝肉嫩滑，锅巴才是灵魂。',
    tip: '现点现做要等 30 分钟，错峰来',
    lat: 22.7766, lng: 113.2906,
    kw: '红星光发煲仔饭 容桂'
  },
  {
    id: 'niuzhan',
    name: '牛展煲仔饭',
    area: '大良',
    cat: 'rice',
    addr: '大良街道',
    price: '¥40',
    sig: ['秘制牛肉煲仔饭', '腊味煲仔饭加窝蛋'],
    desc: '大良的煲仔饭代表队，牛肉那份浇的是别处吃不到的秘制酱汁。加个窝蛋，蛋液拌进焦香米饭里，是顺德人收尾的标准动作。',
    tip: '午市 11:00–14:00 / 晚市 17:00–20:00。老板脾气出了名的臭，点单别犹豫',
    lat: 22.8428, lng: 113.2844,
    kw: '牛展煲仔饭 大良',
    visited: [
      { name: '真探唐仁杰', cid: 'tangrenjie', platform: 'bilibili', note: '「广东顺德.牛展 厨子探店¥221」2022-09-30，465.2 万播放，04:58', url: 'https://www.bilibili.com/video/BV16t4y1w7Vb' }
    ]
  },
  {
    id: 'wenhua',
    name: '文华老友记',
    area: '容桂',
    cat: 'rice',
    addr: '容桂街道富华路 146 号',
    price: '¥50',
    sig: ['生滚猪杂粥', '枸杞叶猪红汤'],
    desc: '《寻味顺德》里那碗让人心甘情愿等两小时的粥。猪杂屠宰场直供、现切现滚，先下脑花再下心肚腰，最后放猪肝，三分钟浮起时最嫩。本地人标配是加油条泡粥。',
    tip: '宵夜时段去，晚上 11 点后最鲜',
    lat: 22.7791, lng: 113.2921,
    kw: '文华老友记 富华路 容桂'
  },
  {
    id: 'shunderenjia',
    name: '顺德人家（太艮路店）',
    area: '大良',
    cat: 'tea',
    addr: '大良街道太艮路 11 号',
    price: '¥80',
    sig: ['虾饺皇', '伦教糕', '陈村粉卷'],
    desc: '本地人常去的早茶 OG，茶点现点现做，比网红店实惠也正宗。虾饺皮薄馅足，整只鲜虾弹牙；伦教糕发酵到位，米香很正。',
    tip: '早茶、午茶都合适，节假日得早点占位',
    lat: 22.8421, lng: 113.2861,
    kw: '顺德人家 太艮路 大良'
  },
  {
    id: 'dabanqiao',
    name: '大板桥农庄 · 均安蒸猪',
    area: '杏坛',
    cat: 'farm',
    addr: '杏坛镇逢简水乡',
    price: '¥60',
    sig: ['均安蒸猪', '水乡农家菜'],
    desc: '上过 CCTV 的均安蒸猪，整猪古法慢蒸，肥肉油润不腻、瘦肉紧实。切一块蘸白糖是本地吃法，很多人第一次听到会愣一下，吃完就懂了。顺带把逢简水乡逛了。',
    tip: '逢简水乡免费，广东「小周庄」，乌篷船另收费',
    lat: 22.7852, lng: 113.1451,
    kw: '大板桥农庄 均安蒸猪 逢简'
  },
  {
    id: 'jufu',
    name: '聚福山庄',
    area: '勒流',
    cat: 'farm',
    addr: '勒流街道',
    price: '¥100',
    sig: ['吊烧鳗鱼', '古法叉烧'],
    desc: '勒流的宴席级硬菜担当，吊烧鳗鱼和古法叉烧是招牌。宴请朋友来这家不丢面子，也比市区那些游客店实在。',
    tip: '适合人多聚餐，两人来点不动菜',
    lat: 22.8551, lng: 113.1902,
    kw: '聚福山庄 勒流'
  },
  {
    id: 'feiguang',
    name: '肥光鱼生',
    area: '大良',
    cat: 'fish',
    addr: '大良街道（近福盈酒店，导航「肥光鱼生」）',
    price: '¥80',
    sig: ['一鱼四吃', '鱼生', '鱼头粥', '炸鱼骨'],
    desc: '顺德的招牌菜式体验店。一鱼四吃 112 块左右：鱼生、炸鱼、鱼皮、鱼头粥，柠檬草、姜丝、芝麻、榨菜、花生十几种配料自己捞。鱼生直接加酱油就很好吃，口感比想象中接近刺身。',
    tip: '必须提前一天电话订位，报人数和到店时间；淡水鱼生生食，肠胃敏感的慎点',
    lat: 22.8362, lng: 113.2831,
    kw: '肥光鱼生 大良'
  },
  {
    id: 'dongyiwan',
    name: '东逸湾酒店',
    area: '容桂',
    cat: 'fish',
    addr: '容桂街道小黄圃外环路 38 号',
    price: '¥150',
    sig: ['海鲈鱼生', '盐焗手撕鸡', '龙虾汤海鲜泡饭'],
    desc: '2023 年上榜「顺德鱼生标准示范店」，也是顺德鱼生节的参与商户。想吃鱼生又怕卫生问题的，来这种有资质公示的地方最稳，海鲈鱼生是主打。',
    tip: '酒楼体量，宴请合适；两人来点鱼生+一个热菜刚好',
    lat: 22.7761, lng: 113.3042,
    kw: '东逸湾酒店 容桂'
  },
  {
    id: 'fengchengyupi',
    name: '凤城鱼皮',
    area: '大良',
    cat: 'snack',
    addr: '大良金榜上街',
    price: '¥25',
    sig: ['现拌鱼皮', '牛乳片'],
    desc: '现拌鱼皮爽脆无腥，配一片牛乳正好解腻。金榜这条街上跟欢记、梯底连着吃，一趟就把水牛奶和鱼皮都收了。',
    tip: '现拌现吃，打包回酒店会软',
    lat: 22.8459, lng: 113.2874,
    kw: '凤城鱼皮 金榜上街'
  },

  /* ========== 干蒸排骨 ========== */
  {
    id: 'xiongdi',
    name: '兄弟干蒸排骨（羊额店）',
    area: '伦教',
    cat: 'steam',
    addr: '伦教街道羊额官沙新福路 4 号',
    price: '¥35',
    sig: ['干蒸排骨', '蒸大肠', '蒸肠头', '蒸凤爪', '蒸牛丸'],
    desc: '老牌广式蒸味小店，羊额这条村的老广烟火味。干蒸排骨、蒸大肠、蒸肠头、蒸凤爪、蒸牛丸，全是原汁原味那一套，不加花哨调料，靠食材新鲜和火候说话。',
    tip: '08:00–14:30 / 17:30–20:30。藏在羊额村里，导航到「羊额官沙」再走进去',
    lat: 22.8800, lng: 113.2280,
    approx: true,
    kw: '兄弟干蒸排骨 羊额 伦教'
  },
  {
    id: 'zizhenggong',
    name: '滋整公干蒸排骨饭',
    area: '大良',
    cat: 'steam',
    addr: '大良凤翔路 41 号顺博创意园 E 栋 115（东三门最近）',
    price: '¥40',
    sig: ['干蒸排骨饭', '干逼走地鸡', '干逼白鳝', '干逼大肠头'],
    desc: '把干蒸和干逼当招牌的新派小店。全程不加一滴水，全靠猛火高温锁住表面、再慢慢逼出食材自己的油脂香，出锅外层焦香微脆、里面还嫩。排骨现斩、鱼现宰、鸡现切，点了才做。',
    tip: '10:30–14:30 / 17:30–21:00。现点现做要等 30 分钟，赶时间先打电话 18929970363 下单',
    lat: 22.8285, lng: 113.2765,
    approx: true,
    kw: '滋整公 干蒸排骨饭 顺博创意园 大良'
  },

  /* ========== 博主探过的店 ========== */
  {
    id: 'moshijibao',
    name: '莫氏鸡煲',
    area: '陈村',
    cat: 'farm',
    addr: '陈村镇绀现村堤围边（导航「莫氏鸡煲」）',
    price: '¥60',
    sig: ['药材鸡煲', '自泡牛大力酒', '五指毛桃酒'],
    desc: '本来一天只做十来桌的村头街坊店，2026 年 3 月被刘雨鑫一条视频点着，48 小时曝光破 1.5 亿，单日排队峰值超三百桌、客流破三千。老板莫叔全程在劝退——「回头你搞得太好，生意太忙，我做不了啊」。现宰本地散养土鸡慢火焖，墙上贴着一张「饮汤后可能有的人会出现上厕所现象，此属正常」。',
    tip: '11:00–14:00 / 17:00–20:00。爆火后陈村镇连夜协调了两千多平临时停车场。老板明确说价格不涨、不开分店',
    lat: 22.9740, lng: 113.1560,
    approx: true,
    kw: '莫氏鸡煲 绀现村 陈村',
    featured: '刘雨鑫引爆 · 5 亿话题',
    visited: [
      { name: '刘雨鑫JASON', cid: 'liuyuxin', platform: 'douyin', note: '2026-03-25 发布，点赞超 150 万，曝光超 1.5 亿，把整个绀现村带成了打卡地', url: 'https://www.douyin.com/search/%E8%8E%AB%E6%B0%8F%E9%B8%A1%E7%85%B2%20%E5%88%98%E9%9B%A8%E9%91%AB' }
    ]
  },
  {
    id: 'shuixiantou',
    name: '水仙头私房菜',
    area: '容桂',
    cat: 'private',
    addr: '容桂街道东堤路（德胜河畔）',
    price: '¥180–300',
    sig: ['盐焗奄仔蟹', '避风塘炒虾', '煎焗白鳝'],
    desc: '藏在德胜河边一处私宅里，近水楼台先得鲜，每天直接从渔民手里收生猛海产。拿手是盐焗奄仔蟹，嫩蟹裹粗盐和香料焗制，蟹黄饱满流油。做法偏咸香和干香，跟传统河鲜的清淡是两条路，重口味海鲜党的天堂。',
    tip: '人均 180–300，两个人不好点菜。隋坡那期标题就是「出名但是评论两极分化」，先看视频再决定',
    lat: 22.7795, lng: 113.2820,
    approx: true,
    kw: '水仙头私房菜 容桂 东堤路',
    visited: [
      { name: '特厨隋坡', cid: 'tangsui', platform: 'bilibili', note: '「特厨探店｜出名但是评论两极分化？—水仙头私房菜到底怎么样！」2026-02-10，156.9 万播放', url: 'https://www.bilibili.com/video/BV1UQcTz9E8U' }
    ]
  },
  {
    id: 'xiangjiang',
    name: '香江饭店',
    area: '大良',
    cat: 'private',
    addr: '大良街道（导航「香江饭店 顺德」）',
    price: '¥120',
    sig: ['顺德鱼生', '传统粤菜小炒'],
    desc: '隋坡给它的定语是「美食之都最爱的老字号」。顺德本地人宴客会想起来的那类老牌饭店，做传统粤菜，出品走稳重路线，不玩新派花样。',
    tip: '具体门店位置待核，导航请直接搜「香江饭店」确认分店',
    lat: 22.8420, lng: 113.2880,
    approx: true,
    kw: '香江饭店 大良 顺德',
    visited: [
      { name: '特厨隋坡', cid: 'tangsui', platform: 'bilibili', note: '「特厨探店｜美食之都最爱的老字号？！」2026-02-17，173.8 万播放', url: 'https://www.bilibili.com/video/BV1BUc4ztEsz' }
    ]
  },
  {
    id: 'shunfengshaoji',
    name: '顺峰烧鸡',
    area: '大良',
    cat: 'farm',
    addr: '大良街道顺峰山一带（导航「顺峰烧鸡」）',
    price: '¥70',
    sig: ['烧鸡', '农家小炒'],
    desc: '顺德吃鸡的另一路：烧鸡。隋坡那期的结论挺有意思——「一桌子菜吃出了上下两极」，也就是同一桌有的很行、有的很一般，点单得挑。',
    tip: '点单前建议先看那期视频的菜名，别整桌一起点',
    lat: 22.8330, lng: 113.2740,
    approx: true,
    kw: '顺峰烧鸡 大良 顺德',
    visited: [
      { name: '特厨隋坡', cid: 'tangsui', platform: 'bilibili', note: '「特厨探店｜一桌子菜吃出了上下两极？！」2026-02-14，170.9 万播放', url: 'https://www.bilibili.com/video/BV1m4FXzyEt9' }
    ]
  },
  {
    id: 'zhengsiwei',
    name: '蒸四味',
    area: '大良',
    cat: 'steam',
    addr: '大良街道（无门头无招牌，导航「蒸四味」碰运气）',
    price: '¥45',
    sig: ['蒸四味', '家常蒸菜'],
    desc: '没有门头、没有招牌的顺德小店——隋坡那期标题就这么写的。做的是最朴素的蒸菜，靠街坊口口相传活着。这种店在顺德不算稀有，稀有在被博主挖出来了。',
    tip: '无招牌，位置待核；到附近问本地人「蒸四味」比导航准',
    lat: 22.8400, lng: 113.2860,
    approx: true,
    kw: '蒸四味 大良 顺德',
    visited: [
      { name: '特厨隋坡', cid: 'tangsui', platform: 'bilibili', note: '「特厨探店｜没有门头没有招牌的顺德小店—蒸四味」2026-02-23，166.9 万播放', url: 'https://www.bilibili.com/video/BV1wVcvzsEs9' }
    ]
  },
  {
    id: 'damengong',
    name: '大门公',
    area: '容桂',
    cat: 'private',
    addr: '容桂街道大门村（导航「大门公」）',
    price: '¥280',
    sig: ['顺德鱼生', '传统粤菜'],
    desc: '唐仁杰那一期花了 ¥838，标题是《遗憾总是贯穿人生始终》。容桂大门村的老牌粤菜，宴会级体量，一个人来点不动菜。',
    tip: '人均参考 ¥280 是按唐仁杰那桌折算，实际看怎么点',
    lat: 22.7680, lng: 113.2960,
    approx: true,
    kw: '大门公 容桂 顺德',
    visited: [
      { name: '真探唐仁杰', cid: 'tangrenjie', platform: 'bilibili', note: '「顺德.大门公 厨子探店¥838」2022-09-21，174.4 万播放，04:22', url: 'https://www.bilibili.com/video/BV1MY4y1N7rA' }
    ]
  },
  {
    id: 'qiaozhu',
    name: '寻味顺德·桥珠印象·鱼生私房菜',
    area: '大良',
    cat: 'fish',
    addr: '大良延年路 38 号（野火游泳馆旁）',
    price: '¥120',
    sig: ['顺德鱼生', '顺德菜全席'],
    desc: '品城记给的推荐指数是五颗星。招牌是鱼生，但除了鱼生，其它顺德菜也做得相当不错，属于「全能型」顺德菜餐厅。环境比大排档好，出品也更精致，家庭聚会或商务都撑得住。',
    tip: '09:30 开始营业，电话 18022223238',
    lat: 22.8380, lng: 113.2960,
    approx: true,
    kw: '桥珠印象 鱼生私房菜 延年路 大良',
    visited: [
      { name: '品城记Video', cid: 'pinchengji', platform: 'bilibili', note: '微博发过完整探店，评分与人均在正文里；B 站未检索到以该店名为标题的视频，链接为 UP 主主页，可用右侧按钮按店名再搜', url: 'https://space.bilibili.com/35364728' }
    ]
  },
  {
    id: 'shaoezai',
    name: '烧鹅再·传统顺德菜（大良店）',
    area: '大良',
    cat: 'roast',
    addr: '大良广源路 19 号',
    price: '¥59',
    sig: ['现点现烧烧鹅', '芋头蚬肉饭', '酿辣椒拼鱼饼'],
    desc: '品城记评价最实在的一点：烧鹅是现点现烧的，不需要额外加烧鹅汁，靠本来流出来的汁就够香。老板不事张扬但细节用足心思。半只烧鹅 80 元，人均 59。',
    tip: '11:00–14:00 / 16:30–21:00，电话 18038842436。想吃现烧的别赶最后一波',
    lat: 22.8400, lng: 113.2900,
    approx: true,
    kw: '烧鹅再 传统顺德菜 广源路 大良',
    visited: [
      { name: '品城记Video', cid: 'pinchengji', platform: 'bilibili', note: '「現場即點即燒！隻隻爆汁！」口味 4.25 / 环境 4.08 / 服务 4.17（微博同步）；B 站未检索到同名视频，链接为 UP 主主页', url: 'https://space.bilibili.com/35364728' },
      { name: '庞师不是师', cid: 'pangshi', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E5%BA%9E%E5%B8%88%E4%B8%8D%E6%98%AF%E5%B8%88%20%E7%83%A7%E9%B9%85%E5%86%8D' }
    ]
  },

  /* ========== 2025 大众点评必吃榜 · 补全落点 ==========
     以下 11 家来自必吃榜名单，此前只有名字没有地图点，
     坐标按所在街区近似（approx），导航统一走高德关键词搜索。 */
  {
    id: 'songji',
    name: '松记食店',
    area: '容桂',
    cat: 'farm',
    addr: '容桂街道（导航「松记食店」）',
    price: '¥90',
    sig: ['清水打边炉', '猪鼻筋', '牛展'],
    desc: '顺德清水打边炉的代表店：一锅清水，靠食材本味说话，蘸料自己调。老广吃火锅最原始的形态，锅底什么都不加，敢这么干的店必须食材够硬。',
    tip: '必吃榜在榜。菜品按人头点，两个人两三样就够',
    lat: 22.7750, lng: 113.2880,
    approx: true,
    kw: '松记食店 容桂',
    badge: '2025 必吃榜'
  },
  {
    id: 'maijiazhuang',
    name: '麦家庄酒家',
    area: '陈村',
    cat: 'private',
    addr: '陈村镇（导航「麦家庄酒家」）',
    price: '¥100',
    sig: ['桑拿菜', '桑拿鸡', '桑拿鱼'],
    desc: '桑拿菜专门店：烧热的石锅里铺食材，浇汤盖上蒸，靠蒸汽把鲜味逼出来。陈村除了陈村粉，这一路做法也值得专门试一次。',
    tip: '必吃榜在榜。桑拿菜要等，别赶时间',
    lat: 22.9800, lng: 113.1650,
    approx: true,
    kw: '麦家庄酒家 陈村',
    badge: '2025 必吃榜'
  },
  {
    id: 'aduo',
    name: '阿多私房菜',
    area: '勒流',
    cat: 'private',
    addr: '勒流街道（导航「阿多私房菜」）',
    price: '¥110',
    sig: ['顺德私房菜', '宴席菜'],
    desc: '勒流的私房菜馆，跟聚福山庄同属宴席级那一档。顺德私房菜的正确打开方式是凑一桌人，两个人来点不动。',
    tip: '必吃榜在榜。人少建议中午去',
    lat: 22.8560, lng: 113.1900,
    approx: true,
    kw: '阿多私房菜 勒流',
    badge: '2025 必吃榜'
  },
  {
    id: 'liaoge',
    name: '了哥烧鹅皇',
    area: '大良',
    cat: 'roast',
    addr: '大良街道（导航「了哥烧鹅皇」）',
    price: '¥60',
    sig: ['烧鹅', '烧腊拼盘'],
    desc: '必吃榜里唯一主打烧腊的顺德区门店。顺德烧鹅除了黄连大头华那条线，大良这家是另一条，皮脆肉嫩的路数。',
    tip: '必吃榜在榜。烧鹅出炉时段去最香，凉了会差一档',
    lat: 22.8420, lng: 113.2870,
    approx: true,
    kw: '了哥烧鹅皇 大良',
    badge: '2025 必吃榜'
  },
  {
    id: 'fenger',
    name: '丰尔粥食',
    area: '大良',
    cat: 'farm',
    addr: '大良街道（导航「丰尔粥食」）',
    price: '¥95',
    sig: ['粥底火锅', '海鲜粥'],
    desc: '粥底火锅，跟毋米粥是同一门手艺的两条路。涮完海鲜，那锅吸满鲜味的粥才是正餐，很多人吃到最后才明白重点在这。',
    tip: '必吃榜在榜。先涮海鲜再涮肉，最后喝粥',
    lat: 22.8370, lng: 113.2900,
    approx: true,
    kw: '丰尔粥食 大良',
    badge: '2025 必吃榜'
  },
  {
    id: 'kaimeizhou',
    name: '开眉粥',
    area: '大良',
    cat: 'farm',
    addr: '大良街道（导航「开眉粥」）',
    price: '¥70',
    sig: ['粥水火锅', '顺德鱼生'],
    desc: '一家店里同时有粥水火锅和顺德鱼生，选择困难症友好。想吃两样顺德代表菜又不想跑两家，来这就行。',
    tip: '必吃榜在榜。鱼生建议提前电话确认当天有没有',
    lat: 22.8400, lng: 113.2850,
    approx: true,
    kw: '开眉粥 大良',
    badge: '2025 必吃榜'
  },
  {
    id: 'yinggu',
    name: '英姑猪杂粥',
    area: '大良',
    cat: 'snack',
    addr: '大良街道（导航「英姑猪杂粥」）',
    price: '¥45',
    sig: ['猪杂粥', '猪红汤'],
    desc: '顺德宵夜的另一面：猪杂粥。跟容桂的文华老友记是同一个路数，一个在容桂一个在大良。猪杂新鲜现切，粥底滚起三分钟就上。',
    tip: '必吃榜在榜。知乎上有回头客说踩雷过，去之前先看近期评价',
    lat: 22.8430, lng: 113.2840,
    approx: true,
    kw: '英姑猪杂粥 大良',
    badge: '2025 必吃榜'
  },
  {
    id: 'daweigong',
    name: '大围公早餐',
    area: '大良',
    cat: 'snack',
    addr: '大良街道（导航「大围公早餐」）',
    price: '¥20',
    sig: ['肠粉', '生滚粥', '早点'],
    desc: '必吃榜少见地把「早餐」单列出来的店。想在顺德吃一顿本地人的早饭，从这开始比从网红店开始靠谱。',
    tip: '必吃榜在榜。早餐店午后就收，别下午去',
    lat: 22.8390, lng: 113.2890,
    approx: true,
    kw: '大围公早餐 大良',
    badge: '2025 必吃榜',
    visited: [
      { name: '野文不懂吃', cid: 'yewen', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E9%87%8E%E6%96%87%E4%B8%8D%E6%87%82%E5%90%83%20%E5%A4%A7%E5%9B%B4%E5%85%AC%E6%97%A9%E9%A4%90' }
    ]
  },
  {
    id: 'xinxin',
    name: '欣欣饭堂',
    area: '大良',
    cat: 'private',
    addr: '大良街道（导航「欣欣饭堂」）',
    price: '¥60',
    sig: ['家常顺德菜', '时令小炒'],
    desc: '名字就叫饭堂，做的是街坊日常那一口。必吃榜里的平价选项，不装、不贵、不难吃，就是本地人吃饭的地方。',
    tip: '必吃榜在榜',
    lat: 22.8410, lng: 113.2860,
    approx: true,
    kw: '欣欣饭堂 大良',
    badge: '2025 必吃榜',
    visited: [
      { name: '野文不懂吃', cid: 'yewen', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E9%87%8E%E6%96%87%E4%B8%8D%E6%87%82%E5%90%83%20%E6%AC%A3%E6%AC%A3%E9%A5%AD%E5%A0%82' }
    ]
  },
  {
    id: 'xile',
    name: '喜乐茶档',
    area: '陈村',
    cat: 'tea',
    addr: '陈村镇（导航「喜乐茶档」）',
    price: '¥35',
    sig: ['港式奶茶', '菠萝油', '西多士'],
    desc: '陈村的港式茶档，吃完陈村粉想换个口味就来这。必吃榜里少有的茶餐厅品类。',
    tip: '必吃榜在榜',
    lat: 22.9800, lng: 113.1680,
    approx: true,
    kw: '喜乐茶档 陈村',
    badge: '2025 必吃榜'
  },
  {
    id: 'huashu',
    name: '華叔咖啡',
    area: '大良',
    cat: 'tea',
    addr: '大良街道（导航「華叔咖啡」）',
    price: '¥30',
    sig: ['手冲咖啡', '菠萝油'],
    desc: '顺德老派冰室路子，咖啡配菠萝油那种。吃撑了来坐一下午，看看顺德人怎么消磨时间。',
    tip: '必吃榜在榜',
    lat: 22.8440, lng: 113.2900,
    approx: true,
    kw: '華叔咖啡 大良',
    badge: '2025 必吃榜'
  },

  /* ========== 用户补充的博主店 ========== */
  {
    id: 'rongli',
    name: '容里煲仔饭',
    area: '容桂',
    cat: 'rice',
    addr: '容桂街道容里（导航「容里煲仔饭」）',
    price: '¥40',
    sig: ['煲仔饭'],
    desc: '容桂容里一带的煲仔饭。容桂本来就是煲仔饭扎堆的地方——红星光发、牛展都在这一片，这家是本地人另指的一处。庞师去过。',
    tip: '具体门牌与出品细节待核，导航请搜「容里煲仔饭」确认；现点现做一般要等',
    lat: 22.7900, lng: 113.2650,
    approx: true,
    kw: '容里煲仔饭 容桂',
    visited: [
      { name: '庞师不是师', cid: 'pangshi', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E5%BA%9E%E5%B8%88%E4%B8%8D%E6%98%AF%E5%B8%88%20%E5%AE%B9%E9%87%8C%E7%85%B2%E4%BB%94%E9%A5%AD' }
    ]
  },
  {
    id: 'gongsi',
    name: '公司排骨饭',
    area: '大良',
    cat: 'steam',
    addr: '大良街道（店名按口述，门牌待核）',
    price: '¥40',
    sig: ['干蒸排骨饭'],
    desc: '野文探过的一家干蒸排骨饭。顺德把排骨饭当日常主食，这类店通常没招牌菜式清单，就是排骨、米饭、例汤三件套，靠火候和米汁过日子。',
    tip: '店名按用户口述记录，公开检索没查到确切门店（也有可能是「公记排骨饭」），导航时先确认一下',
    lat: 22.8400, lng: 113.2880,
    approx: true,
    kw: '公司排骨饭 大良 顺德',
    visited: [
      { name: '野文不懂吃', cid: 'yewen', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E9%87%8E%E6%96%87%E4%B8%8D%E6%87%82%E5%90%83%20%E5%85%AC%E5%8F%B8%E6%8E%92%E9%AA%A8%E9%A5%AD' }
    ]
  },
  {
    id: 'runji',
    name: '润记宵夜',
    area: '大良',
    cat: 'farm',
    addr: '大良环城路 13 号（大良钟楼地铁站 B 口步行 480 米）',
    price: '¥50–63',
    sig: ['牛杂煲', '炸鸡翅', '卜卜贝', '紫苏炒田螺', '炒米粉'],
    desc: '夫妻经营的大排档，街坊熟客为主，店面不起眼、墙上贴着手写菜单。牛杂煲是每桌必点的那个——牛肚多、配娃娃菜豆腐泡猪肠粉萝卜鱼蛋，偏咸偏重口，加份方便面最对。炸鸡翅 6 块一只，外脆里嫩有汁水，是这家的隐藏招牌。',
    tip: '18:00–凌晨 1:30，中午不开。停车不方便，建议停旧一中再走过来',
    lat: 22.842057, lng: 113.256632,
    kw: '润记宵夜 环城路 大良',
    visited: [
      { name: '野文不懂吃', cid: 'yewen', platform: 'douyin', note: '探过这家（用户指认）。视频链接待补，点开是平台搜索结果', url: 'https://www.douyin.com/search/%E9%87%8E%E6%96%87%E4%B8%8D%E6%87%82%E5%90%83%20%E6%B6%A6%E8%AE%B0%E5%AE%B5%E5%A4%9C' }
    ]
  }
];

/* ==========================================================
   2025 大众点评「必吃榜」· 顺德区上榜餐厅
   ----------------------------------------------------------
   来源：大众点评 2025 必吃榜发榜名单（佛山全市 45 家，
        顺德区 15 家），经「佛山本地宝」整理稿转述核对。
   注意：大众点评必吃榜不对第三方开放 API，此为公开榜单
        人工结构化录入，带年份标注，非实时接口。
   rating / reviews 只在有明确公开数值时填写，其余留空，
        不做估算。
   ========================================================== */
const MUST_EAT = {
  year: 2025,
  source: '大众点评 2025 必吃榜 · 佛山顺德区（15 家）',
  sourceNote: '榜单本身不提供公开 API，本条为公开名单整理录入，非实时数据。',
  items: [
    {
      name: '太艮堡毋米粥（锦龙路总店）',
      area: '大良', kind: '顺德菜',
      addr: '大良锦龙路 270 号（聚富楼对面）',
      note: '四代传承的非遗粥水火锅，也做粤式早茶。顺德菜里最能代表「以粥为汤」的一路。收录 19 年，当地人好评率 87%。',
      hours: '11:00–14:00 / 17:30–21:00',
      rating: 4.8, reviews: 9590, price: '¥125',
      mapId: 'taigenbao', lat: 22.8361, lng: 113.2906
    },
    {
      name: '鳗事鱼意 · 活鳗现烤专门店（嘉信城市广场店）',
      area: '大良', kind: '日本料理',
      addr: '大良兴顺路嘉信城市广场二期 C105',
      note: '顺德是「中国鳗鱼之乡」，这家主打自家渔场直供、活鳗现烤，连续 2024–2025 两年上榜。',
      hours: '11:00–14:00 / 17:00–21:00',
      rating: 4.6, reviews: 2356, price: '¥81',
      mapId: 'manshi', lat: 22.8290, lng: 113.3010
    },
    {
      name: '顺德婆私房菜 · 鱼生 · 顺德老字号（伦教三洲店）',
      area: '伦教', kind: '顺德菜',
      addr: '伦教乌洲路 35 号（平岗公园公交站对面）',
      note: '开在伦教三洲村的老字号私房菜，招牌是顺德鱼生。逛完三洲老街过来吃正合适。',
      hours: '工作日 11:00–14:00 / 17:00–21:00；周末中午延至 14:30',
      rating: null, reviews: null, price: '¥100',
      mapId: 'shundepo', lat: 22.8755, lng: 113.2680
    },
    {
      name: '金榜古月鱼皮',
      area: '大良', kind: '快餐简餐',
      addr: '大良金榜上街一带',
      note: '金榜这条街除了牛乳，鱼皮也是一绝。跟欢记、梯底连着吃，一趟把水牛奶和鱼皮都收了。',
      hours: null,
      rating: null, reviews: null, price: '¥25',
      mapId: 'guyue', lat: 22.8452, lng: 113.2873
    },
    {
      name: '松记食店',
      area: '容桂', kind: '火锅',
      addr: '容桂街道（导航「松记食店」）',
      note: '顺德清水打边炉的代表店。一锅清水，靠食材本味说话，蘸料自己调。老广吃火锅的原始形态。',
      hours: null,
      rating: null, reviews: null, price: '¥90',
      mapId: 'songji'
    },
    {
      name: '麦家庄酒家 · 顺德桑拿菜',
      area: '陈村', kind: '私房菜',
      addr: '陈村镇（导航「麦家庄酒家」）',
      note: '桑拿菜专门店：烧热的石锅里铺食材，浇汤盖上蒸，靠蒸汽把鲜味逼出来。陈村除了陈村粉，这路做法也值得试。',
      hours: null,
      rating: null, reviews: null, price: '¥100',
      mapId: 'maijiazhuang'
    },
    {
      name: '阿多私房菜（顺德店）',
      area: '勒流', kind: '私房菜',
      addr: '勒流街道（导航「阿多私房菜」）',
      note: '勒流的私房菜馆，跟聚福山庄同属宴席级那一档。人多吃才划算。',
      hours: null,
      rating: null, reviews: null, price: '¥110',
      mapId: 'aduo'
    },
    {
      name: '了哥烧鹅皇（大良总店）',
      area: '大良', kind: '烧腊',
      addr: '大良街道（导航「了哥烧鹅皇」）',
      note: '榜单里唯一主打烧腊的顺德区门店。顺德烧鹅除了黄连那几家，大良这家是另一条线。',
      hours: null,
      rating: null, reviews: null, price: '¥60',
      mapId: 'liaoge'
    },
    {
      name: '丰尔粥食 · 粥底火锅（大良总店）',
      area: '大良', kind: '火锅',
      addr: '大良街道（导航「丰尔粥食」）',
      note: '粥底火锅，跟毋米粥是同一门手艺的两条路。涮完海鲜，那锅粥才是正餐。',
      hours: null,
      rating: null, reviews: null, price: '¥95',
      mapId: 'fenger'
    },
    {
      name: '开眉粥 · 粥水火锅顺德鱼生',
      area: '大良', kind: '小吃',
      addr: '大良街道（导航「开眉粥」）',
      note: '一家店里同时有粥水火锅和顺德鱼生，选择困难症友好。',
      hours: null,
      rating: null, reviews: null, price: '¥70',
      mapId: 'kaimeizhou'
    },
    {
      name: '英姑猪杂粥',
      area: '大良', kind: '小吃',
      addr: '大良街道（导航「英姑猪杂粥」）',
      note: '顺德宵夜的另一面：猪杂粥。跟文华老友记是同一个路数，一个在容桂一个在大良。',
      hours: null,
      rating: null, reviews: null, price: '¥45',
      mapId: 'yinggu'
    },
    {
      name: '大围公早餐',
      area: '大良', kind: '快餐简餐',
      addr: '大良街道（导航「大围公早餐」）',
      note: '榜单少见地把「早餐」单列出来的店。想在顺德吃一顿本地人的早饭，从这开始。',
      hours: null,
      rating: null, reviews: null, price: '¥20',
      mapId: 'daweigong'
    },
    {
      name: '欣欣饭堂',
      area: '大良', kind: '私房菜',
      addr: '大良街道（导航「欣欣饭堂」）',
      note: '名字就叫饭堂，做的是街坊日常那一口。榜单里的平价选项。',
      hours: null,
      rating: null, reviews: null, price: '¥60',
      mapId: 'xinxin'
    },
    {
      name: '喜乐茶档',
      area: '陈村', kind: '茶餐厅',
      addr: '陈村镇（导航「喜乐茶档」）',
      note: '陈村的港式茶档，吃完陈村粉想换口味就来这。',
      hours: null,
      rating: null, reviews: null, price: '¥35',
      mapId: 'xile'
    },
    {
      name: '華叔咖啡',
      area: '大良', kind: '茶餐厅',
      addr: '大良街道（导航「華叔咖啡」）',
      note: '顺德老派冰室路子，咖啡配菠萝油那种。吃撑了来坐一下午。',
      hours: null,
      rating: null, reviews: null, price: '¥30',
      mapId: 'huashu'
    }
  ]
};

/* 榜单里已经在地图上单独建点的 4 家，补进来方便地图定位 */
const MUST_MAP_ADD = [
  {
    id: 'taigenbao',
    name: '太艮堡毋米粥（锦龙路总店）',
    area: '大良', cat: 'farm',
    addr: '大良锦龙路 270 号（聚富楼对面）',
    price: '¥125',
    sig: ['毋米粥火锅', '粤式早茶'],
    desc: '2025 大众点评必吃榜上榜店，四代传承的非遗粥水火锅。锅底是滤掉米粒的米汤，涮完东西那口粥才是精华。收录 19 年，9,590 条评价，当地人好评率 87%。',
    tip: '11:00–14:00 / 17:30–21:00，有包间，宴请也撑得住',
    lat: 22.8361, lng: 113.2906,
    kw: '太艮堡毋米粥 锦龙路 大良',
    badge: '2025 必吃榜', rating: 4.8, reviews: 9590
  },
  {
    id: 'manshi',
    name: '鳗事鱼意（嘉信城市广场店）',
    area: '大良', cat: 'farm',
    addr: '大良兴顺路嘉信城市广场二期 C105',
    price: '¥81',
    sig: ['活鳗现烤', '鳗鱼饭'],
    desc: '顺德是「中国鳗鱼之乡」，这家自家渔场直供、活鳗现烤，连续 2024–2025 两年上必吃榜。2,356 条评价，4.6 分。',
    tip: '11:00–14:00 / 17:00–21:00，在商场二期里，认准 C105',
    lat: 22.8290, lng: 113.3010,
    kw: '鳗事鱼意 嘉信城市广场 顺德',
    badge: '2025 必吃榜', rating: 4.6, reviews: 2356
  },
  {
    id: 'shundepo',
    name: '顺德婆私房菜（伦教三洲店）',
    area: '伦教', cat: 'private',
    addr: '伦教乌洲路 35 号（平岗公园公交站对面）',
    price: '¥100',
    sig: ['顺德鱼生', '顺德老字号'],
    desc: '2025 必吃榜上榜店，开在伦教三洲村的老字号私房菜，招牌是顺德鱼生。逛完三洲老街过来吃正合适。',
    tip: '工作日 11:00–14:00 / 17:00–21:00，周末中午延到 14:30',
    lat: 22.8755, lng: 113.2680,
    kw: '顺德婆私房菜 伦教三洲',
    badge: '2025 必吃榜'
  },
  {
    id: 'guyue',
    name: '金榜古月鱼皮',
    area: '大良', cat: 'snack',
    addr: '大良金榜上街一带',
    price: '¥25',
    sig: ['鱼皮'],
    desc: '2025 必吃榜上榜店。金榜这条街除了牛乳，鱼皮也是一绝，跟欢记、梯底连着吃，一趟把水牛奶和鱼皮都收了。',
    tip: '现拌现吃，别打包',
    lat: 22.8452, lng: 113.2873,
    kw: '金榜古月鱼皮 大良',
    badge: '2025 必吃榜'
  }
];

SHOPS.push(...MUST_MAP_ADD);

/* ---------- 生成链接（不编造，全部指向真实可用的搜索/官方页） ---------- */
function douyinLink(shop) {
  return 'https://www.douyin.com/search/' + encodeURIComponent(shop.name + ' 探店');
}
function biliLink(shop) {
  return 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(shop.name + ' 顺德 探店');
}

/* 平台搜索直达。
   为什么只给搜索页、不给博主主页：抖音/快手的账号 ID 我没法确证，
   拼一个 /user/xxx 出去就是假链接，点开 404 比给搜索页更坑人。 */
const PLATFORM_LABEL = { douyin: '抖音', bilibili: 'B站', kuaishou: '快手' };

function platformSearch(platform, keyword) {
  const kw = String(keyword || '').trim();
  if (platform === 'douyin') return 'https://www.douyin.com/search/' + encodeURIComponent(kw);
  if (platform === 'kuaishou') return 'https://www.kuaishou.com/search/video?searchKey=' + encodeURIComponent(kw);
  return 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(kw);
}

/* 一条探店记录 → 两个平台的搜索入口（含它自己的主平台，用户想在另一边找也方便） */
function visitSearch(kw) {
  return {
    douyin: platformSearch('douyin', kw),
    bilibili: platformSearch('bilibili', kw),
    kuaishou: platformSearch('kuaishou', kw)
  };
}

/* 判断链接到底是「那一条视频」还是「主页 / 合集 / 搜索页」，
   清单里的标签要如实标，别把主页当成视频糊弄人。 */
function urlKind(url) {
  if (!url) return 'none';
  if (/douyin\.com\/search|bilibili\.com\/all\?keyword|kuaishou\.com\/search/.test(url)) return 'search';
  if (/\/video\/BV|\/video\/av|douyin\.com\/video\//.test(url)) return 'video';
  if (/space\.bilibili\.com|\/lists|collectiondetail|douyin\.com\/user/.test(url)) return 'home';
  return 'link';
}
/* 高德关键词搜索：只用「主店名 + 镇街」，不要把 kw 里那串修饰词全塞进去，
   高德对长串关键词经常匹配不到，反而搜空。 */
function amapNavLink(shop) {
  let q = shop.navKw || shop.name;
  // 官方式长店名（"鳗事鱼意 · 活鳗现烤专门店 · 嘉信店"）只留主名，后段是广告词
  if (q.length > 13 && q.indexOf('·') > 0) {
    const head = q.split('·')[0].trim();
    if (head.length >= 3) q = head;
  }
  // 括号里的分店名高德认不稳，换成空格
  q = q.replace(/[（(]/g, ' ').replace(/[）)]/g, ' ').replace(/\s+/g, ' ').trim();
  // 补镇街，缩小范围（店名里已经带了就不重复）
  if (shop.area && q.indexOf(shop.area) < 0) q += ' ' + shop.area;
  return 'https://uri.amap.com/search?keyword=' + encodeURIComponent(q) +
         '&city=' + encodeURIComponent('佛山') + '&src=shunde-food-map&callnative=1';
}
