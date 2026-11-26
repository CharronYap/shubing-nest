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
SK('dog-home', '歡迎回來', ['dog'], {}, ['m dog c', 'a dog jump', 's dog 你回來了你回來了！', 's dog 你只離開一下下嗎。', 's dog 還是很想你！'], '你只離開一下下，皮蛋還是很想你。');
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
