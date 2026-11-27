/* 小劇場的劇本（第三步，js/skit.js 用）。全部自己寫的，照企劃「娃娃個性」；只有朋友之間的事，沒有戀愛。
   加新的一段只要在這裡多寫一筆，不用改程式。
   SK(代號, 標題, [演員…], 條件, [一步一步…], 看完後相簿裡那一句)
   條件：{furn:'這間要有的家具', room:'要在哪一間', rain:true 下雨天, night:true 晚上}，沒有就寫 {}
   每一步是一行字：
     's 誰 台詞'      頭上冒一句（對話框只有一行，一句 14 個字以內）
     'm 誰 去哪'      一跳一跳過去。去哪可以是另一隻娃娃、家具的代號、c（中間）、l（左邊）、r（右邊）
     'a 誰 動作'      原地小動作：jump、yawn、spin、look
     'n 旁白'         上面那條顯示一句旁白
     'w'              停一下
   要玩家選的地方寫成 {q:'問什麼', o:[['選項', [接下來的步驟…], '選這個時相簿裡那一句'], …]}
   連續劇多寫 serial（哪一條）和 ep（第幾集）：前一集看過、而且不是同一天，才會排下一集。 */
const SKITS = [];
const SKIT_SERIAL = {snack: '點心櫃失竊案', evil: '邪惡豬排博士', bed: '薯餅找床'};
function SK(id, title, cast, need, steps, end, extra){ SKITS.push(Object.assign({id, title, cast, need: need || {}, steps, end}, extra || {})); }

/* ---------- 每隻自己的（16 段） ---------- */
SK('sloth-cloud', '看雲', ['sloth'], {}, ['s sloth 那朵雲長得像沙發。', 'w', 's sloth ……現在像蛋黃哥。', 'a sloth yawn', 's sloth 我剛剛要做什麼。'], '薯餅看雲看到忘記要做什麼。');
SK('sloth-slow', '慢動作', ['sloth'], {}, ['m sloth c', 's sloth 我要去那邊拿東西。', 'n （三分鐘後）', 's sloth 到了。要拿什麼呢。',
  {q: '要提醒牠嗎？', o: [['跟牠說是遙控器', ['s sloth 喔。謝謝。', 's sloth 那先坐一下再拿。'], '薯餅走到了，然後決定先坐一下。'], ['讓牠自己想', ['w', 's sloth 想起來了。是坐下。'], '薯餅自己想起來了：牠是要去坐下。']]}], '');
SK('egg-turn', '今天的大事', ['egg'], {}, ['s egg 今天要完成一件大事。', 's egg 翻身。', 'a egg yawn', 's egg 完成了。收工。'], '蛋黃哥完成了今天的大事：翻身。');
SK('egg-shell', '蛋殼裡', ['egg'], {}, ['s egg 蛋殼裡最安全。',
  {q: '要叫牠出來嗎？', o: [['拿點心哄牠', ['s egg ……點心放門口就好。'], '蛋黃哥沒出來，但點心被拿進去了。'], ['不吵牠', ['s egg 你人真好。晚安。'], '你沒有吵蛋黃哥，牠說你人真好。']]}], '');
SK('dog-hide', '藏拖鞋', ['dog'], {}, ['m dog l', 's dog 藏這裡，沒人知道。', 'm dog r', 's dog 咦，我藏哪裡去了。', 'a dog spin', 's dog 汪！找到了！在嘴裡！'], '皮蛋找了半天的拖鞋，一直在自己嘴裡。');
SK('dog-home', '歡迎回來', ['dog'], {}, ['m dog c', 'a dog jump', 's dog 你回來了你回來了！', 's dog 你才出去一下下嗎。', 's dog 還是很想你！'], '你才出去一下下，皮蛋還是很想你。');
SK('moodeng-high', '跳到天花板', ['moodeng'], {}, ['s moodeng 看我跳到天花板！！', 'a moodeng jump', 's moodeng 差一點！！再來！！', 'a moodeng jump', 's moodeng 天花板太高！！不公平！！'], '彈跳豬想跳到天花板，天花板太高了。');
SK('moodeng-mad', '氣噗噗', ['moodeng'], {}, ['s moodeng 我生氣了！！',
  {q: '怎麼辦？', o: [['給牠一點水', ['s moodeng 水！！', 's moodeng ……好，不氣了！！'], '彈跳豬看到水就不氣了。'], ['等牠氣完', ['w', 's moodeng ……我忘記在氣什麼！！'], '彈跳豬氣到忘記自己在氣什麼。']]}], '');
SK('nyanko-patrol', '巡邏', ['nyanko'], {}, ['m nyanko l', 's nyanko 這裡沒有可疑的東西。', 'm nyanko r', 's nyanko 這裡也沒有點心。可惜。', 's nyanko 巡邏結束。回去睡。'], '貓咪老師巡邏了一圈，沒有找到點心。');
SK('nyanko-taste', '試毒', ['nyanko'], {}, ['s nyanko 這個點心看起來有問題。', 's nyanko 本大爺幫你試一口。', 'a nyanko look', 's nyanko 再試一口，確定一下。', 's nyanko 沒問題。也沒有了。'], '貓咪老師幫你試毒，試到整個吃完。');
SK('dino-seek', '躲貓貓', ['dino'], {}, ['m dino l', 's dino 我躲好了，來找我！', 'w', 's dino ……有人在找嗎？',
  {q: '要怎麼找？', o: [['假裝找不到', ['s dino 嘿嘿，我最會躲！'], '你假裝找不到，龍龍覺得自己最會躲。'], ['直接說找到了', ['s dino 太快了！再一次！'], '你一下就找到龍龍，牠要再玩一次。']]}], '');
SK('dino-leaf', '最慢的人', ['dino'], {}, ['s dino 這片葉子要給最慢的人。', 'm dino c', 's dino 可是大家都不在這裡。', 's dino 那先放自己頭上。'], '龍龍找不到人放葉子，先放在自己頭上。');
SK('snoopy-fly', '起飛', ['snoopy'], {}, ['s snoopy 塔台，請求起飛。', 'a snoopy jump', 's snoopy 高度三公分，天氣良好。', 's snoopy 降落。任務成功。'], '王牌飛行員飛了三公分高，任務成功。');
SK('snoopy-line', '第一句', ['snoopy'], {}, ['s snoopy 那是一個黑漆漆的晚上。', 's snoopy 不對。太普通了。', 's snoopy 那是一個很亮的晚上。',
  {q: '哪一句比較好？', o: [['黑漆漆的晚上', ['s snoopy 經典。就用這句。'], '史努比的小說決定從黑漆漆的晚上開始。'], ['很亮的晚上', ['s snoopy 創新。編輯會喜歡。'], '史努比的小說決定從很亮的晚上開始。']]}], '');
SK('piggy-count', '數錢', ['piggy'], {}, ['s piggy 一枚、兩枚、三枚。', 's piggy 等一下，剛剛數到幾。', 's piggy 都是你在旁邊看害的。', 's piggy 重來。一枚。'], '火腿數錢數到一半忘了，說是你害的。');
SK('piggy-review', '擺設講評', ['piggy'], {}, ['m piggy c', 's piggy 今天的擺設，我講評一下。', 's piggy 沙發，可以。地板，普通。', 's piggy 我，滿分。散會。'], '火腿講評房間的擺設，只有牠自己滿分。');

/* ---------- 兩隻一組（16 段） ---------- */
SK('p-leafhat', '頭上的葉子', ['dino', 'sloth'], {}, ['m dino sloth', 'n （龍龍把葉子放上去）', 's sloth ……頭上是不是有東西。', 's dino 沒有喔。', 's sloth 好。那就是帽子。'], '龍龍在薯餅頭上放葉子，薯餅把它當帽子。');
SK('p-script', '講稿', ['piggy', 'dino'], {}, ['n 龍龍把火腿的講稿換成了白紙', 'm piggy c', 's piggy 各位，今天我要講的是——', 's piggy ……怎麼是白的。',
  {q: '要怎麼做？', o: [['告訴火腿', ['s piggy 龍龍！', 's dino 被發現了，快跑。', 'm dino l'], '你告訴火腿講稿是龍龍換的，龍龍跑掉了。'], ['幫龍龍保密', ['s piggy 沒關係，我用背的。', 's dino 嘿嘿。'], '你幫龍龍保密，火腿靠背的講完了。'], ['假裝沒看到', ['s piggy 那今天改成即興演出。', 'a dino jump'], '你假裝沒看到，火腿改成即興演出。']]}], '');
SK('p-mess', '誰比較亂', ['dino', 'moodeng'], {}, ['m dino moodeng', 's dino 比賽誰弄得比較亂。', 's moodeng 我一定贏！！', 'a moodeng jump', 'a dino jump', 's dino 平手。那誰收？', 's moodeng 不是我！！'], '龍龍和彈跳豬比誰弄得亂，沒有人要收。');
SK('p-ignore', '九千公尺', ['dog', 'snoopy'], {}, ['m dog snoopy', 's dog 下來玩嘛。', 's snoopy 我在九千公尺的高空。', 's dog 你明明在地上。', 's snoopy ……等我降落再說。'], '皮蛋找史努比玩，史努比說牠還在天上。');
SK('p-roast', '互相吐槽', ['piggy', 'nyanko'], {}, ['m piggy nyanko', 's piggy 你今天吃第幾份了。', 's nyanko 關你這顆撲滿什麼事。', 's piggy 我是關心你的腰。', 's nyanko 我沒有腰。我是圓的。'], '火腿和貓咪老師一見面就互相吐槽。');
SK('p-still', '一動也不動', ['sloth', 'egg'], {}, ['m sloth egg', 's sloth 我坐你旁邊喔。', 's egg 嗯。', 'n （過了很久）', 's sloth 我們今天有做什麼嗎。', 's egg 有。我們坐著。'], '薯餅和蛋黃哥坐了一整天，這就是今天做的事。');
SK('p-walk', '散步', ['dog', 'sloth'], {}, ['m dog sloth', 's dog 我們去散步！', 's sloth 好。', 'm dog l', 's dog 你怎麼還在原地！', 's sloth 我出發了。在心裡。'], '皮蛋找薯餅散步，薯餅在心裡出發了。');
SK('p-stomp', '踩到計畫', ['piggy', 'moodeng'], {}, ['s piggy 這是我的秘密計畫，別碰。', 'm moodeng piggy', 'a moodeng jump', 's piggy ……你踩在上面。', 's moodeng 這是紙嗎！！滑滑的！！'], '火腿的秘密計畫被彈跳豬踩在腳下。');
SK('p-sun', '那塊太陽', ['nyanko', 'sloth'], {}, ['m nyanko sloth', 's nyanko 這塊太陽是我的。', 's sloth 好。我曬旁邊那塊。', 's nyanko ……過來一點也可以。'], '貓咪老師佔了太陽，又叫薯餅靠過來一點。');
SK('p-spot', '起不來', ['nyanko', 'egg'], {}, ['m nyanko egg', 's nyanko 喂，這是我的位置。', 's egg 我起不來。', 's nyanko 哼。那我躺你旁邊。', 's egg 好擠。可是好暖。'], '蛋黃哥佔了位置起不來，貓咪老師躺在牠旁邊。');
SK('p-chase', '換你追我', ['dog', 'moodeng'], {}, ['s dog 來追我！', 'm dog r', 'm moodeng dog', 's moodeng 抓到了！！', 'm moodeng l', 'm dog moodeng', 's dog 汪！換你追我！'], '皮蛋和彈跳豬追來追去，誰也不想停。');
SK('p-enemy', '敵機', ['snoopy', 'moodeng'], {}, ['s snoopy 發現敵機，準備迎戰。', 's moodeng 我不是敵機！！', 'a moodeng jump', 's snoopy 敵機會跳。記錄下來。'], '史努比把彈跳豬當成敵機，還做了紀錄。');
SK('p-slipper', '搶拖鞋', ['dino', 'dog'], {}, ['m dino dog', 's dino 這隻拖鞋借我。', 's dog 汪！那是我藏的！',
  {q: '拖鞋給誰？', o: [['給皮蛋', ['s dog 汪！謝謝你！', 's dino 下次我藏好一點。'], '拖鞋還給皮蛋，龍龍說下次要藏好一點。'], ['給龍龍', ['s dino 嘿嘿。', 's dog 嗚……我還有另一隻。'], '拖鞋給了龍龍，還好皮蛋還有另一隻。'], ['一人一隻', ['s dog 好！', 's dino 好吧，成交。'], '拖鞋一人一隻，皮蛋和龍龍都同意。']]}], '');
SK('p-fee', '出場費', ['snoopy', 'piggy'], {}, ['m snoopy piggy', 's snoopy 我的小說缺一個反派。', 's piggy 邪惡豬排博士，很貴。', 's snoopy 我付你一個驚嘆號。', 's piggy ……成交。'], '火腿答應當小說裡的反派，酬勞是一個驚嘆號。');
SK('p-scout', '偵察兵', ['snoopy', 'dino'], {}, ['s snoopy 偵察兵，前面有什麼。', 'm dino l', 's dino 報告，有一張沙發。', 's snoopy 可疑。繼續觀察。', 's dino 報告，沙發沒有動。'], '龍龍當偵察兵，回報沙發沒有動。');
SK('p-wake', '最認真的姿勢', ['moodeng', 'egg'], {}, ['m moodeng egg', 's moodeng 起來陪我玩！！', 's egg 我在陪了。', 's moodeng 你躺著！！', 's egg 這是我最認真的姿勢。'], '彈跳豬叫蛋黃哥起來玩，蛋黃哥說牠已經在陪了。');

/* ---------- 三隻以上（4 段） ---------- */
SK('g-clean', '大掃除', ['piggy', 'dino', 'moodeng'], {}, ['s piggy 今天大掃除，聽我指揮。', 'a dino jump', 'a moodeng jump', 's piggy 不是叫你們弄更亂。', 's dino 我們在暖身。', 's moodeng 掃完了！！（沒有）'], '火腿指揮大掃除，房間比掃之前更亂。');
SK('g-nap', '午睡大會', ['nyanko', 'sloth', 'egg'], {}, ['s nyanko 午睡時間，都不准吵。', 's sloth 好。', 's egg 我已經開始了。', 'n （三隻都睡著了）', 's nyanko ……點心……別跑……'], '午睡大會開始，貓咪老師在說夢話。');
SK('g-explore', '探險隊', ['snoopy', 'dog', 'dino'], {}, ['s snoopy 探險隊，出發。', 'm dog l', 'm dino r', 's dog 汪！這邊有餅乾屑！', 's dino 這邊有另一隻拖鞋！', 's snoopy 重大發現。寫進日誌。'], '探險隊在房間裡找到餅乾屑和一隻拖鞋。');
SK('g-smart', '誰最聰明', ['piggy', 'nyanko', 'sloth'], {}, ['s piggy 我最聰明，沒意見吧。', 's nyanko 活了幾百年的是我。', 's sloth 我覺得你們都很厲害。', 's piggy ……牠這樣講，吵不下去。'], '火腿和貓咪老師比誰聰明，被薯餅一句話講到吵不下去。');

/* ---------- 跟家具、房間有關（4 段） ---------- */
SK('f-tv', '看電視', ['sloth'], {furn: 'tv'}, ['m sloth tv', 's sloth 這一台在演雲。', 's sloth 好看。', 'n （電視其實沒有開）'], '薯餅看電視看得很開心，電視其實沒有開。');
SK('f-tub', '我的浴缸', ['moodeng'], {furn: 'tub'}, ['m moodeng tub', 's moodeng 水！！我的！！', 'a moodeng jump', 's moodeng 誰都不准進來！！', 's moodeng ……要一起也可以！！'], '彈跳豬佔了浴缸，後來說要一起也可以。');
SK('f-shelf', '高的地方', ['snoopy'], {furn: 'shelf'}, ['m snoopy shelf', 's snoopy 這個高度，適合思考。', 's snoopy 思考結果：肚子餓了。'], '史努比到高的地方思考，結論是肚子餓了。');
SK('f-sofa', '沙發是誰的', ['nyanko', 'dog'], {furn: 'sofa'}, ['m nyanko sofa', 's nyanko 這張沙發歸我。', 'm dog sofa', 's dog 汪！我也要坐！', 's nyanko ……只能坐邊邊。', 's dog 邊邊最好！'], '貓咪老師說沙發歸牠，還是讓皮蛋坐了邊邊。');

/* ---------- 連續劇：點心櫃失竊案 ---------- */
SK('ep-snack-1', '點心櫃失竊案（一）', ['nyanko', 'snoopy'], {}, ['s nyanko 我的點心少了一塊！', 'm snoopy nyanko', 's snoopy 名偵探到。現場不要動。', 's nyanko 我一直都在這裡。', 's snoopy 很好。嫌疑犯是所有人。'], '貓咪老師的點心少了一塊，史努比開始辦案。', {serial: 'snack', ep: 1});
SK('ep-snack-2', '點心櫃失竊案（二）', ['snoopy', 'dog', 'nyanko'], {}, ['s snoopy 第一位嫌疑犯，皮蛋。', 's dog 汪？我只藏拖鞋。', 's snoopy 嘴邊有沒有屑屑。', 's dog 那是泥土！', 's snoopy 暫時排除。暫時。'], '皮蛋嘴邊的是泥土，暫時排除嫌疑。', {serial: 'snack', ep: 2});
SK('ep-snack-3', '點心櫃失竊案（三）', ['snoopy', 'piggy', 'nyanko'], {}, ['s snoopy 第二位，火腿。', 's piggy 我是撲滿，肚子裡只有錢。', 's nyanko 搖搖看就知道。', 's piggy 不准搖！', 's snoopy 聲音是硬幣。排除。'], '火腿肚子裡只有硬幣，也排除了。', {serial: 'snack', ep: 3});
SK('ep-snack-4', '點心櫃失竊案（四）', ['snoopy', 'nyanko'], {}, ['s snoopy 我找到犯人了。', 's nyanko 是誰！', 's snoopy 你昨天半夜自己吃的。', 's nyanko ……本大爺想起來了。',
  {q: '要說什麼？', o: [['笑牠', ['s nyanko 哼！不准說出去！', 's snoopy 本案結案。'], '犯人是貓咪老師自己，牠叫大家不准說出去。'], ['說沒關係', ['s nyanko ……下一塊分你。', 's snoopy 本案結案。'], '犯人是貓咪老師自己，牠說下一塊要分你。']]}], '', {serial: 'snack', ep: 4});

/* ---------- 連續劇：邪惡豬排博士 ---------- */
SK('ep-evil-1', '邪惡豬排博士（一）', ['piggy', 'moodeng'], {}, ['s piggy 我是邪惡豬排博士。', 's piggy 今天要佔領這張沙發。', 'm moodeng piggy', 'a moodeng jump', 's piggy ……計畫書被踩扁了。'], '博士要佔領沙發，計畫書被彈跳豬踩扁。', {serial: 'evil', ep: 1});
SK('ep-evil-2', '邪惡豬排博士（二）', ['piggy', 'moodeng'], {}, ['s piggy 第二號計畫：統治點心。', 's moodeng 點心在哪！！', 'm moodeng l', 's piggy 等等，那是誘餌——', 's moodeng 吃掉了！！'], '博士的誘餌被彈跳豬吃掉了。', {serial: 'evil', ep: 2});
SK('ep-evil-3', '邪惡豬排博士（三）', ['piggy', 'moodeng'], {}, ['s piggy 第三號計畫，絕對保密。', 's moodeng 你在講什麼秘密！！', 's piggy ……你為什麼都聽得到。', 's moodeng 因為你很大聲！！'], '博士的秘密計畫講得太大聲，全被聽到了。', {serial: 'evil', ep: 3});
SK('ep-evil-4', '邪惡豬排博士（四）', ['piggy', 'moodeng'], {}, ['s piggy 博士宣布退休。', 's moodeng 不行！！我還想玩！！',
  {q: '要怎麼辦？', o: [['請博士再演一次', ['s piggy 既然觀眾要求……', 's piggy 邪惡豬排博士，回來了。', 'a moodeng jump'], '在大家的要求下，邪惡豬排博士復出了。'], ['讓博士休息', ['s piggy 那我改當顧問。', 's moodeng 顧問也可以踩嗎！！'], '博士退休改當顧問，彈跳豬問顧問能不能踩。']]}], '', {serial: 'evil', ep: 4});

/* ---------- 連續劇：薯餅找床 ---------- */
SK('ep-bed-1', '薯餅找床（一）沙發', ['sloth'], {furn: 'sofa'}, ['m sloth sofa', 's sloth 沙發。軟。', 's sloth 可是會滑下去。', 's sloth 明天試別的。'], '薯餅試了沙發：很軟，可是會滑下去。', {serial: 'bed', ep: 1});
SK('ep-bed-2', '薯餅找床（二）床', ['sloth'], {furn: 'bed'}, ['m sloth bed', 's sloth 床。很大。', 's sloth 大到找不到邊。', 's sloth 有一點寂寞。'], '薯餅試了床：太大了，有一點寂寞。', {serial: 'bed', ep: 2});
SK('ep-bed-3', '薯餅找床（三）浴缸', ['sloth'], {furn: 'tub'}, ['m sloth tub', 's sloth 浴缸。涼涼的。', 's sloth 轉身會滑。扣分。'], '薯餅試了浴缸：涼涼的，轉身會滑。', {serial: 'bed', ep: 3});
SK('ep-bed-4', '薯餅找床（四）', ['sloth'], {}, ['m sloth c', 's sloth 我都試過了。', 's sloth 最好睡的地方是——',
  {q: '是哪裡？', o: [['你旁邊', ['s sloth 對。就是這裡。', 'a sloth yawn', 's sloth 晚安。'], '薯餅找到全家最好睡的地方：你旁邊。'], ['哪裡都可以', ['s sloth 你怎麼知道。', 'a sloth yawn', 's sloth 晚安。'], '薯餅發現牠哪裡都睡得著。']]}], '', {serial: 'bed', ep: 4});

/* ================= 第二批（2026-11-26，40 段） =================
   方向：新玩家一開始娃娃不多，所以以「一隻就能演」的為主（每隻 3 段，其中 1 段會問你）；
   補上第一批沒用到的條件：下雨天、晚上、廚房、閣樓；專屬家具 3 段；三隻以上挑第一批沒同台過的組合。
   小島那一頁娃娃不在房間裡，演不了，所以沒有小島的段落。 */

/* ---------- 一隻就能演（24 段，每隻 3 段） ---------- */
SK('sloth-count', '數到三', ['sloth'], {}, ['s sloth 我數到三就起來。', 's sloth 一。', 'w', 's sloth 二。', 'n （過了很久）', 's sloth 三是明天的事。'], '薯餅數到二就停了，三是明天的事。');
SK('sloth-wave', '打招呼', ['sloth'], {}, ['s sloth 你剛剛跟我揮手嗎。', 's sloth 我現在揮回去。', 'a sloth look',
  {q: '要揮回去嗎？', o: [['也揮回去', ['s sloth 嗯。我們打過招呼了。', 's sloth 下次我會快一點。'], '薯餅慢了半天才揮手，你們還是打到招呼了。'], ['等牠揮完', ['w', 's sloth 揮完了。手有點酸。'], '薯餅認真把手揮完，說手有點酸。']]}], '');
SK('sloth-race', '比誰慢', ['sloth'], {}, ['s sloth 跟你比誰比較慢。', 's sloth 預備。開始。', 'w', 'n （誰都沒有動）', 's sloth 你很強。平手。'], '薯餅跟你比誰比較慢，最後平手。');
SK('egg-blanket', '棉被', ['egg'], {}, ['s egg 這條棉被黏住我了。', 's egg 不是我不起來。', 'a egg yawn', 's egg 是它不讓我走。'], '蛋黃哥說不是牠不起來，是棉被黏住牠。');
SK('egg-plan', '明天的行程', ['egg'], {}, ['s egg 我在排明天的行程。', 's egg 早上躺著。下午也是。',
  {q: '晚上呢？', o: [['晚上也躺著', ['s egg 你懂我。', 's egg 行程排滿了。好累。'], '蛋黃哥明天的行程排滿了：全部都是躺著。'], ['晚上陪你玩', ['s egg ……好麻煩。', 's egg 躺著玩可以嗎。'], '蛋黃哥答應晚上陪你玩，條件是躺著玩。']]}], '');
SK('egg-roll', '滾過去', ['egg'], {}, ['s egg 餅乾掉在那邊。', 's egg 走過去太累。', 'm egg c', 'n （牠是滾過去的）', 's egg 到了。先休息再吃。'], '蛋黃哥滾去撿餅乾，到了先休息。');
SK('dog-tail', '尾巴', ['dog'], {}, ['s dog 後面有東西跟著我！', 'a dog spin', 's dog 汪！它也跟著轉！', 'a dog spin', 's dog ……是我的尾巴。'], '皮蛋追了半天，發現那是自己的尾巴。');
SK('dog-gift', '最寶貝的', ['dog'], {}, ['m dog c', 's dog 我有東西要送你！', 's dog 是我最寶貝的拖鞋！',
  {q: '要收下嗎？', o: [['收下', ['a dog jump', 's dog 汪！要好好藏起來喔！'], '皮蛋把最寶貝的拖鞋送你，叫你好好藏起來。'], ['讓牠自己留著', ['s dog 真的嗎！', 's dog 那我幫你保管！'], '你讓皮蛋自己留著拖鞋，牠說是幫你保管。']]}], '');
SK('dog-guard', '看門', ['dog'], {}, ['m dog r', 's dog 我在看門！很認真！', 's dog 有人來我就叫！', 'w', 's dog ……都沒有人來。', 's dog 那我叫給你聽。汪！'], '皮蛋認真看門，沒有人來，就叫給你聽。');
SK('moodeng-tall', '長高了', ['moodeng'], {}, ['s moodeng 我今天長高了！！', 'a moodeng jump', 's moodeng 你看！！比昨天高！！', 's moodeng 因為我在半空中！！'], '彈跳豬說牠長高了，因為牠在半空中。');
SK('moodeng-pet', '不准摸', ['moodeng'], {}, ['s moodeng 不准摸我！！', 'w', 's moodeng ……你怎麼真的沒摸！！',
  {q: '要摸嗎？', o: [['摸一下', ['s moodeng 哼！！', 's moodeng 只有今天可以！！'], '彈跳豬說不准摸，又說只有今天可以。'], ['真的不摸', ['s moodeng 那我自己靠過去！！', 'm moodeng c'], '你沒有摸彈跳豬，牠自己靠過來了。']]}], '');
SK('moodeng-shadow', '影子', ['moodeng'], {}, ['s moodeng 誰在學我！！', 'a moodeng jump', 's moodeng 你還學！！', 'n （那是牠的影子）', 's moodeng 算了！！一起跳！！'], '彈跳豬跟自己的影子吵架，後來一起跳。');
SK('nyanko-rest', '閉目養神', ['nyanko'], {}, ['s nyanko 本大爺在閉目養神。', 'a nyanko yawn', 's nyanko 沒有在睡。', 'n （牠打呼了）', 's nyanko ……剛剛那是修行。'], '貓咪老師說牠沒有在睡，那是修行。');
SK('nyanko-share', '饅頭', ['nyanko'], {}, ['s nyanko 這塊饅頭是我的。', 's nyanko ……你一直看是什麼意思。',
  {q: '要說什麼？', o: [['說想吃', ['s nyanko 哼。分你一小塊。', 's nyanko 小塊的那一邊。'], '貓咪老師分你饅頭，小塊的那一邊。'], ['說只是看看', ['s nyanko 那你繼續看。', 's nyanko ……拿去啦，一半。'], '你說只是看看，貓咪老師還是分你一半。']]}], '');
SK('nyanko-round', '有福氣', ['nyanko'], {}, ['s nyanko 誰說本大爺胖。', 's nyanko 這叫做有福氣。', 'a nyanko jump', 's nyanko 看，還跳得起來。', 's nyanko ……落地有點重。'], '貓咪老師說牠是有福氣，跳得起來，落地有點重。');
SK('dino-roar', '練習吼', ['dino'], {}, ['s dino 我要練習最兇的吼。', 's dino 吼～', 's dino 不夠兇。再一次。', 'a dino jump', 's dino 吼～（破音了）'], '龍龍練習最兇的吼，結果破音了。');
SK('dino-swap', '偷換', ['dino'], {}, ['s dino 我把兩樣東西換過來了。', 's dino 你猜是哪兩樣。',
  {q: '猜得到嗎？', o: [['到處找找看', ['w', 's dino 其實我什麼都沒換。', 's dino 可是你找了好久。嘿嘿。'], '龍龍說牠換了東西，其實什麼都沒換。'], ['直接問牠', ['s dino 不能問！要用猜的！', 's dino 好啦。是我的兩隻襪子。'], '龍龍偷換的是牠自己的兩隻襪子。']]}], '');
SK('dino-peek', '有洞的葉子', ['dino'], {}, ['s dino 這是我今天撿的葉子。', 's dino 這片給你，這片給我。', 's dino 這片有洞，可以偷看。', 'a dino look', 's dino 我看到你了。'], '龍龍撿了葉子，用有洞的那片偷看你。');
SK('snoopy-log', '今日日誌', ['snoopy'], {}, ['s snoopy 今日日誌。', 's snoopy 早上：英勇地起床。', 's snoopy 中午：英勇地吃飯。', 's snoopy 下午：待補。先睡。'], '史努比的日誌寫到下午，先睡了。');
SK('snoopy-role', '今天演誰', ['snoopy'], {}, ['s snoopy 今天我要扮演一個角色。',
  {q: '演什麼好？', o: [['船長', ['s snoopy 全員注意，準備開船。', 's snoopy 船在哪裡。浴缸嗎。'], '史努比今天是船長，船是浴缸。'], ['廚師', ['s snoopy 今日特餐是白開水。', 's snoopy 火候剛好。請慢用。'], '史努比今天是廚師，特餐是白開水。'], ['什麼都不演', ['s snoopy 演自己最難。', 's snoopy 我需要排練。'], '史努比說演自己最難，要先排練。']]}], '');
SK('snoopy-radar', '雷達', ['snoopy'], {}, ['s snoopy 雷達發現不明物體。', 'm snoopy l', 's snoopy 接近中。保持冷靜。', 's snoopy 確認。是一顆鈕扣。', 's snoopy 解除警報。'], '史努比的雷達發現不明物體，是一顆鈕扣。');
SK('piggy-sky', '說來話長', ['piggy'], {}, ['s piggy 你知道天為什麼是藍的嗎。', 's piggy 我知道。', 's piggy 但是說來話長。', 's piggy 所以不說了。'], '火腿知道天為什麼是藍的，但是不說。');
SK('piggy-heavy', '變重了', ['piggy'], {}, ['s piggy 我今天變重了。', 's piggy 不是胖。是存款增加。',
  {q: '要說什麼？', o: [['恭喜牠', ['s piggy 謝謝。你很有眼光。', 's piggy 存夠了請你吃飯。'], '火腿變重是因為存款增加，還說要請你吃飯。'], ['問牠存了多少', ['s piggy 這是機密。', 's piggy 提示：比你多。'], '火腿不肯說存了多少，只說比你多。']]}], '');
SK('piggy-motto', '今日一句', ['piggy'], {}, ['m piggy c', 's piggy 今天送大家一句話。', 's piggy 早睡早起身體好。', 's piggy 我自己做不到。', 's piggy 所以送給你們。'], '火腿送大家一句話：早睡早起，牠自己做不到。');

/* ---------- 下雨天（2 段） ---------- */
SK('w-rain-sloth', '聽雨', ['sloth'], {rain: true}, ['s sloth 外面在下雨。', 's sloth 雨也是慢慢掉下來的。', 'a sloth yawn', 's sloth 我們是同一國的。'], '下雨天，薯餅說雨跟牠是同一國的。');
SK('w-rain-fly', '室內飛行', ['dog', 'snoopy'], {rain: true}, ['m dog snoopy', 's dog 下雨了！不能出去玩！', 's snoopy 本日停飛。原因：下雨。', 's dog 那我們在家裡飛！', 'a dog jump', 's snoopy 批准。室內飛行。'], '下雨天不能出去，皮蛋和史努比改在家裡飛。');

/* ---------- 晚上（3 段） ---------- */
SK('n-egg', '天黑了', ['egg'], {night: true}, ['s egg 天黑了。', 's egg 終於可以光明正大躺著。', 's egg 白天躺會被唸。', 's egg 晚上躺叫做睡覺。'], '天黑了，蛋黃哥說晚上躺著叫做睡覺。');
SK('n-piggy', '燈不要關', ['piggy'], {night: true}, ['s piggy 我才不怕黑。', 's piggy 只是燈不要關比較好。',
  {q: '要陪牠嗎？', o: [['陪牠一下', ['s piggy 我沒有叫你陪。', 's piggy ……但是不准走。'], '火腿說牠不怕黑，但是不准你走。'], ['幫牠留一盞燈', ['s piggy 很好。這樣比較省事。', 's piggy ……謝了。'], '你幫火腿留了一盞燈，牠小聲說了謝謝。']]}], '');
SK('n-brew', '醞釀睡意', ['dog', 'sloth'], {night: true}, ['m dog sloth', 's dog 你怎麼還沒睡！', 's sloth 我在醞釀。', 's dog 那我陪你醞釀！', 'n （皮蛋先睡著了）', 's sloth ……晚安。'], '皮蛋陪薯餅醞釀睡意，自己先睡著了。');

/* ---------- 廚房（2 段）、閣樓（2 段）：那隻娃娃要擺在那一間 ---------- */
SK('k-nyanko', '好料', ['nyanko'], {room: 'kitchen'}, ['m nyanko c', 's nyanko 廚房是本大爺的地盤。', 's nyanko 聞到了。今天有好料。', 'a nyanko look', 's nyanko ……只有聞到。在哪裡。'], '貓咪老師在廚房聞到好料，找不到在哪裡。');
SK('k-egg', '平底鍋', ['egg'], {room: 'kitchen'}, ['s egg 這裡是廚房。', 's egg 我覺得有點危險。', 's egg 那個平底鍋在看我。',
  {q: '要怎麼辦？', o: [['擋在牠前面', ['s egg 謝謝。我躲你後面躺。'], '蛋黃哥覺得平底鍋在看牠，躲到你後面躺。'], ['說平底鍋是空的', ['s egg 空的才可怕。', 's egg 它在等。'], '你說平底鍋是空的，蛋黃哥說空的才可怕。']]}], '');
SK('t-snoopy', '觀測站', ['snoopy'], {room: 'attic'}, ['m snoopy c', 's snoopy 這裡是高空觀測站。', 's snoopy 目前高度：兩層樓。', 's snoopy 視野良好。看到屋頂了。'], '史努比把閣樓當高空觀測站，看到了屋頂。');
SK('t-sloth', '等流星', ['sloth'], {room: 'attic'}, ['s sloth 聽說這裡看得到流星。', 's sloth 我要許願。', 'w', 's sloth 願望還沒想好。', 's sloth 流星可以等我嗎。'], '薯餅在閣樓等流星，願望還沒想好。');

/* ---------- 專屬家具（3 段） ---------- */
SK('f-hammock', '吊床', ['sloth'], {furn: 'hammock'}, ['m sloth hammock', 's sloth 吊床會自己搖。', 's sloth 我不用動。它幫我動。', 'a sloth yawn', 's sloth 這是我見過最好的發明。'], '薯餅說吊床是最好的發明：牠不用動。');
SK('f-trampoline', '彈簧床', ['moodeng'], {furn: 'trampoline'}, ['m moodeng trampoline', 's moodeng 這個會把我彈回來！！', 'a moodeng jump', 's moodeng 再高一點！！', 'a moodeng jump', 's moodeng 剛剛那下有摸到雲！！'], '彈跳豬在彈簧床上跳，說牠摸到雲了。');
SK('f-snackcab', '看守點心櫃', ['nyanko'], {furn: 'snackcab'}, ['m nyanko snackcab', 's nyanko 本大爺負責看守這裡。', 's nyanko 誰都不准開。',
  {q: '要開嗎？', o: [['請牠開一下', ['s nyanko 密碼是摸我的頭。', 's nyanko ……好了。只能拿一個。'], '點心櫃的密碼是摸貓咪老師的頭。'], ['不開', ['s nyanko 很好。你通過考驗了。', 's nyanko 獎品是一塊點心。'], '你沒有開點心櫃，貓咪老師說你通過考驗。']]}], '');

/* ---------- 三隻以上（4 段，第一批沒同台過的組合） ---------- */
SK('g-photo', '大合照', ['dog', 'egg', 'moodeng'], {}, ['s dog 來拍大合照！', 'm dog c', 'm moodeng dog', 's moodeng 我要站中間！！', 's egg 我躺前面就好。', 's dog 一、二、三！', 'a moodeng jump', 's egg 牠跳出去了。重拍。'], '拍大合照的時候彈跳豬跳出去了，要重拍。');
SK('g-class', '第一課', ['nyanko', 'dino', 'dog'], {}, ['s nyanko 今天本大爺教你們。', 's nyanko 第一課：怎麼要點心。', 's dog 汪！我會！坐下！', 's dino 我會！直接拿走！', 's nyanko ……你們都不及格。', 's nyanko 正確答案是裝可憐。'], '貓咪老師教大家怎麼要點心：裝可憐。');
SK('g-story', '念小說', ['snoopy', 'sloth', 'egg'], {}, ['s snoopy 我來念我的小說。', 's snoopy 第一章。', 'n （念了很久）', 's snoopy 完。有什麼感想。', 's sloth 第一句很好。', 's egg 後面我睡著了。'], '史努比念小說給大家聽，蛋黃哥睡著了。');
SK('g-vote', '晚餐表決', ['piggy', 'dog', 'egg'], {}, ['s piggy 現在表決晚餐吃什麼。', 's dog 汪！都可以！', 's egg 不用嚼的。', 's piggy 這樣沒辦法統計。',
  {q: '你投哪一個？', o: [['都可以', ['s dog 汪！我們一樣！', 's piggy 兩票。通過。吃都可以。'], '晚餐表決的結果是：都可以。'], ['不用嚼的', ['s egg 有品味。', 's piggy 兩票。通過。喝湯。'], '晚餐表決的結果是不用嚼的，喝湯。']]}], '');

/* ================= 家具第二、三批和天氣（2026-11-27，12 段） =================
   甜點、森林露營、海邊、太空系列各 2 段，魚缸 1 段，下雨天 1 段，晚上 2 段。
   家具的那幾段：演的娃娃要跟那件家具擺在同一間才會排到（家具一開始在哪一間看 furn2.js、furn3.js 的 room）。
   家具搬得到別的房間，所以台詞不寫「浴室」「客廳」這種只對一間成立的話。 */

/* ---------- 甜點系列（2 段） ---------- */
SK('f-pudding', '會抖的桌子', ['dog', 'egg'], {furn: 'puddingtable'}, ['m dog puddingtable', 's dog 這張桌子是布丁耶！', 'a dog jump', 's dog 汪！我一跳它就抖！', 'm egg puddingtable', 's egg 抖的是我。被你震的。',
  {q: '要讓皮蛋再跳嗎？', o: [['再跳一次', ['a dog jump', 's dog 汪！你們一起抖！', 's egg ……好累。抖也好累。'], '皮蛋一跳，布丁桌和蛋黃哥一起抖。'], ['請皮蛋坐好', ['s dog 好！我坐好了！', 's egg 謝謝。我繼續躺。'], '你請皮蛋坐好，蛋黃哥終於可以繼續躺。']]}], '');
SK('f-cakecab', '用看的吃', ['nyanko', 'piggy'], {furn: 'cakecab'}, ['m nyanko cakecab', 's nyanko 這塊蛋糕在叫本大爺。', 'm piggy cakecab', 's piggy 那是擺好看的。', 's nyanko 擺著不吃，太浪費了。', 's piggy 蓋子打不開啦。', 'a nyanko look', 's nyanko ……那本大爺用看的吃。'], '貓咪老師打不開蛋糕櫃，改用看的吃蛋糕。');

/* ---------- 森林露營系列（2 段） ---------- */
SK('f-campfire', '烤棉花糖', ['dog', 'sloth'], {furn: 'campfire'}, ['m dog campfire', 's dog 我們來烤棉花糖！', 'm sloth campfire', 's sloth 這是燈耶。', 's dog 用想像的烤！汪！', 's sloth 好。我在烤了。', 'w', 's dog 我的好了！你的呢？', 's sloth ……焦了。我想太久。'], '薯餅在營火燈前烤想像的棉花糖，想太久烤焦了。');
SK('f-minitent', '通關密語', ['dino', 'dog'], {furn: 'minitent'}, ['m dino minitent', 's dino 這裡是秘密基地。', 'm dog minitent', 's dog 汪！我也要進去！', 's dino 要說通關密語喔。',
  {q: '要幫皮蛋猜嗎？', o: [['猜「拖鞋」', ['s dog 拖鞋！', 's dino 怎麼猜到的！進來！'], '皮蛋猜中秘密基地的密語：拖鞋。'], ['猜「葉子」', ['s dog 葉子！', 's dino 差一點。算你對！'], '皮蛋猜葉子，龍龍說差一點也算對。'], ['不幫牠猜', ['s dog 那我在門口等！', 'w', 's dino ……好啦，快進來。'], '皮蛋在帳篷門口等，龍龍還是讓牠進去了。']]}], '');

/* ---------- 海邊系列（2 段） ---------- */
SK('f-parasol', '在家度假', ['snoopy', 'piggy'], {furn: 'parasol'}, ['m snoopy parasol', 's snoopy 作家來海邊度假了。', 's snoopy 陽光，海浪，好舒服。', 'm piggy parasol', 's piggy 這裡是室內耶。', 's snoopy 噓。不要吵我度假。', 's piggy ……好啦。傘下分我一半。'], '史努比在遮陽傘下假裝度假，火腿也分到一半的位子。');
SK('f-boatbed', '會漂走嗎', ['sloth', 'piggy'], {furn: 'boatbed'}, ['m sloth boatbed', 's sloth 這張床是一艘船耶。', 's sloth 睡著會漂走嗎。', 'm piggy boatbed', 's piggy 不會。地板沒有水。', 's sloth 那漂到夢裡呢。', 's piggy ……那我坐船頭看路。'], '薯餅怕小船床漂走，火腿說牠坐船頭幫忙看路。');

/* ---------- 太空系列（2 段） ---------- */
SK('f-telescope', '新星球', ['snoopy'], {furn: 'telescope'}, ['m snoopy telescope', 's snoopy 天文學家上工了。', 'a snoopy look', 's snoopy 發現一顆新星球！', 'n （望遠鏡對著天花板）', 's snoopy 要幫它取個名字。',
  {q: '叫什麼好？', o: [['史努比星', ['s snoopy 很好。非常有品味。'], '史努比發現一顆新星球，取名史努比星。'], ['晚餐星', ['s snoopy 聽起來很好吃。', 's snoopy 今晚出發去探險。'], '史努比發現一顆新星球，取名晚餐星。'], ['天花板星', ['s snoopy ……你是不是看出來了。'], '你把新星球取名天花板星，史努比好像發現了。']]}], '');
SK('f-rocketbed', '倒數', ['moodeng', 'egg'], {furn: 'rocketbed'}, ['m moodeng rocketbed', 's moodeng 火箭要起飛了！！', 's moodeng 誰要去太空！！', 'm egg rocketbed', 's egg 太空要走路嗎。', 's moodeng 不用！！用飄的！！', 's egg 那我去。', 's moodeng 三！！二！！一！！', 'a moodeng jump', 's egg 到了叫我。我先睡。'], '聽說太空不用走路，蛋黃哥就上了火箭床。');

/* ---------- 魚缸（1 段） ---------- */
SK('f-fishtank', '看魚', ['nyanko'], {furn: 'fishtank'}, ['m nyanko fishtank', 's nyanko 本大爺在看魚。', 's nyanko 不是想吃。是在看。', 'a nyanko look', 's nyanko ……牠們也一直看我。',
  {q: '要跟牠說什麼？', o: [['魚只是在游泳', ['s nyanko 哼，我知道。', 's nyanko 本大爺再盯一下。'], '貓咪老師說牠不是想吃魚，只是盯著看。'], ['魚想跟你玩', ['s nyanko 本大爺很忙的。', 'a nyanko look', 's nyanko ……玩一下也行。'], '魚想跟貓咪老師玩，牠說玩一下也行。']]}], '');

/* ---------- 下雨天（1 段） ---------- */
SK('w-rain-moodeng', '雨在跳', ['moodeng'], {rain: true}, ['s moodeng 下雨了！！是水！！', 's moodeng 我要出去跳！！', 'a moodeng jump', 's moodeng 窗戶不讓我出去！！',
  {q: '要怎麼陪牠？', o: [['一起在窗邊看雨', ['s moodeng 雨在跳！！跟我一樣！！', 'a moodeng jump', 's moodeng 我跳得比較高！！'], '下雨天，彈跳豬在窗邊跟雨比賽跳高。'], ['說雨停再出去', ['s moodeng 那雨快停！！', 's moodeng ……不對！！不准停！！'], '彈跳豬要雨快點停，又說不准停。']]}], '');

/* ---------- 晚上（2 段） ---------- */
SK('n-quiet', '誰最小聲', ['dino', 'moodeng'], {night: true}, ['m dino moodeng', 's dino 噓，晚上要小聲。', 's dino 來比誰最小聲。', 's moodeng 好！！我最小聲！！', 's dino ……你已經輸了。', 's moodeng 不公平！！（小聲）'], '晚上龍龍和彈跳豬比誰最小聲，彈跳豬一開口就輸了。');
SK('n-nyanko', '宵夜', ['nyanko'], {night: true}, ['s nyanko 晚上肚子特別餓。', 's nyanko 這是常識。', 'a nyanko look', 's nyanko 所以要吃宵夜。',
  {q: '要給牠什麼？', o: [['一小塊點心', ['s nyanko 哼，算你懂事。', 's nyanko 這塊本大爺收下了。'], '貓咪老師吃了宵夜，說你算懂事。'], ['一杯熱牛奶', ['s nyanko 那是小貓喝的吧。', 'a nyanko look', 's nyanko ……再一杯。'], '貓咪老師說熱牛奶是小貓喝的，還是喝了兩杯。']]}], '');
