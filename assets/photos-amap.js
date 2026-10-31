/* 高德地图店铺相册（用户实拍返图）。
   已逐张看过：只留菜品/食物特写，门头、菜单牌、店内空景、商家海报都已剔除。
   抓不到相册的店不在本表里，前端会自动回落到 B 站探店视频图（assets/photos.js）。
   带 branch 字段的，是图取自同品牌其他分店（POI 匹配到的是另一家门店），页面上会明确标注。
   每张的 poi 是高德 POI id，可在灯箱里点「在高德看这家」回原页面核对。 */
const AMAP_PHOTOS = {
 "minxin": [
  {
   "src": "assets/photos-amap/minxin/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0L6X73J2A",
   "branch": "双皮奶博物馆店"
  }
 ],
 "renxin": [
  {
   "src": "assets/photos-amap/renxin/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0LDUDAHME"
  }
 ],
 "tidi": [
  {
   "src": "assets/photos-amap/tidi/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "asan": [
  {
   "src": "assets/photos-amap/asan/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/asan/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/asan/3.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B02F50VXIW"
  }
 ],
 "ximei": [
  {
   "src": "assets/photos-amap/ximei/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0J3ODQ2BE"
  },
  {
   "src": "assets/photos-amap/ximei/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0J3ODQ2BE"
  }
 ],
 "lanjie": [
  {
   "src": "assets/photos-amap/lanjie/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFG1ATPN"
  },
  {
   "src": "assets/photos-amap/lanjie/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFG1ATPN"
  }
 ],
 "pingjie": [
  {
   "src": "assets/photos-amap/pingjie/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B02F506EL7"
  }
 ],
 "huangliandatouhua": [
  {
   "src": "assets/photos-amap/huangliandatouhua/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFF6OZRQ"
  },
  {
   "src": "assets/photos-amap/huangliandatouhua/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFF6OZRQ"
  }
 ],
 "dadi": [
  {
   "src": "assets/photos-amap/dadi/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "zhuroupo": [
  {
   "src": "assets/photos-amap/zhuroupo/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B02F50W1MH"
  }
 ],
 "huangdanji": [
  {
   "src": "assets/photos-amap/huangdanji/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/huangdanji/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "rongbian": [
  {
   "src": "assets/photos-amap/rongbian/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "hongxing": [
  {
   "src": "assets/photos-amap/hongxing/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "",
   "branch": "文海店"
  },
  {
   "src": "assets/photos-amap/hongxing/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "",
   "branch": "文海店"
  }
 ],
 "wenhua": [
  {
   "src": "assets/photos-amap/wenhua/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFGXGVPJ"
  },
  {
   "src": "assets/photos-amap/wenhua/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFGXGVPJ"
  }
 ],
 "shunderenjia": [
  {
   "src": "assets/photos-amap/shunderenjia/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "",
   "branch": "黄金商业广场店"
  }
 ],
 "dabanqiao": [
  {
   "src": "assets/photos-amap/dabanqiao/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B02F50V3VX"
  }
 ],
 "jufu": [
  {
   "src": "assets/photos-amap/jufu/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/jufu/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "feiguang": [
  {
   "src": "assets/photos-amap/feiguang/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/feiguang/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/feiguang/3.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "moshijibao": [
  {
   "src": "assets/photos-amap/moshijibao/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "shuixiantou": [
  {
   "src": "assets/photos-amap/shuixiantou/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/shuixiantou/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/shuixiantou/3.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFH4NOT6"
  }
 ],
 "xiangjiang": [
  {
   "src": "assets/photos-amap/xiangjiang/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B02F503ZZ8"
  }
 ],
 "shunfengshaoji": [
  {
   "src": "assets/photos-amap/shunfengshaoji/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFFTIZJ1"
  }
 ],
 "zhengsiwei": [
  {
   "src": "assets/photos-amap/zhengsiwei/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0IAVAGJEA"
  }
 ],
 "damengong": [
  {
   "src": "assets/photos-amap/damengong/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/damengong/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "qiaozhu": [
  {
   "src": "assets/photos-amap/qiaozhu/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "shaoezai": [
  {
   "src": "assets/photos-amap/shaoezai/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFHDXK4M"
  }
 ],
 "songji": [
  {
   "src": "assets/photos-amap/songji/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/songji/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B02F50W369"
  }
 ],
 "maijiazhuang": [
  {
   "src": "assets/photos-amap/maijiazhuang/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/maijiazhuang/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFGY9782"
  }
 ],
 "aduo": [
  {
   "src": "assets/photos-amap/aduo/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFF4WFSG"
  }
 ],
 "liaoge": [
  {
   "src": "assets/photos-amap/liaoge/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "fenger": [
  {
   "src": "assets/photos-amap/fenger/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "kaimeizhou": [
  {
   "src": "assets/photos-amap/kaimeizhou/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFH0XXQV"
  }
 ],
 "yinggu": [
  {
   "src": "assets/photos-amap/yinggu/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFHGFVSX"
  }
 ],
 "daweigong": [
  {
   "src": "assets/photos-amap/daweigong/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFGNTTLW"
  }
 ],
 "xinxin": [
  {
   "src": "assets/photos-amap/xinxin/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFHFQ9YN"
  },
  {
   "src": "assets/photos-amap/xinxin/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFHFQ9YN"
  }
 ],
 "xile": [
  {
   "src": "assets/photos-amap/xile/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0G1ZH6VLR"
  }
 ],
 "huashu": [
  {
   "src": "assets/photos-amap/huashu/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0JBDMXAUW"
  },
  {
   "src": "assets/photos-amap/huashu/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "rongli": [
  {
   "src": "assets/photos-amap/rongli/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/rongli/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFH11H2C"
  }
 ],
 "gongsi": [
  {
   "src": "assets/photos-amap/gongsi/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0JRUXVWH9"
  }
 ],
 "runji": [
  {
   "src": "assets/photos-amap/runji/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0H2OABBDP"
  }
 ],
 "taigenbao": [
  {
   "src": "assets/photos-amap/taigenbao/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "",
   "branch": "良缘路店"
  }
 ],
 "manshi": [
  {
   "src": "assets/photos-amap/manshi/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  },
  {
   "src": "assets/photos-amap/manshi/2.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": "B0FFIAD2JP"
  }
 ],
 "shundepo": [
  {
   "src": "assets/photos-amap/shundepo/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ],
 "guyue": [
  {
   "src": "assets/photos-amap/guyue/1.jpg",
   "title": "",
   "from": "amap",
   "author": "",
   "poi": ""
  }
 ]
};
