export type Source = 'claude' | 'chatgpt' | 'mcp' | 'chat' | 'manual';
export interface Message { role: 'user' | 'assistant' | 'note'; content: string; created_at: string }
export interface ConversationSummary { id: string; title: string; source: Source; tags: string[]; created_at: string; snippet: string; archived: boolean; archived_at: string | null; starred?: boolean; starred_at?: string | null }
export interface Conversation extends ConversationSummary { messages: Message[] }

const date = (day: string) => `${day}T10:30:00Z`;
function conversation(id: string, title: string, source: Source, tags: string[], day: string, snippet: string, question: string, answer: string): Conversation {
  return { id, title, source, tags, created_at: date(day), snippet, archived: false, archived_at: null, starred: false, starred_at: null, messages: question ? [{ role: 'user', content: question, created_at: date(day) }, { role: 'assistant', content: answer, created_at: date(day) }] : [{ role: 'note', content: answer, created_at: date(day) }] };
}
export function createSampleConversations(): Conversation[] {
  return markArchived([
    conversation('soup', 'A simple vegetable soup for a quiet evening', 'claude', ['cooking', 'recipes'], '2026-11-14', 'A flexible one-pot soup with everyday vegetables, white beans, and a little lemon.', 'What is an easy vegetable soup I can make with pantry staples?', `Start with onion, carrots, and celery, then add whatever vegetables you have. White beans make it a satisfying meal without much extra work.

## Ingredients

| Ingredient | Amount | Alternative |
| --- | --- | --- |
| Onion | 1 medium | 2 shallots |
| Carrots | 2 | Sweet potato |
| Celery | 2 stalks | A small leek |
| White beans | 1 can, drained | Chickpeas |
| Vegetable stock | 1 litre | Water with extra seasoning |
| Leafy greens | 2 handfuls | Frozen spinach |

## Method

1. Dice the onion, carrots, and celery.
2. Soften them in a little olive oil for about 10 minutes.
3. Add the stock and beans. Simmer until the vegetables are tender.
4. Stir in the greens and cook for another few minutes.
5. Taste, season, and finish with a squeeze of lemon.

> Add delicate greens near the end so they keep their texture.

Serve with bread. Refrigerate leftovers promptly in shallow containers, and reheat only the portion you need.`),
    conversation('forest', '森林徒步：轻松的半日路线', 'chatgpt', ['hiking', 'outdoors'], '2026-11-12', '选一条短环线，带上水和午餐，把时间留给观察树木和休息。', '第一次去森林徒步，怎样安排一个不赶路的半日行程？', '## 从短路线开始\n\n选择标记清楚、坡度平缓的环线，提前查看天气和步道开放情况。\n\n| 阶段 | 安排 |\n| --- | --- |\n| 出发前 | 下载地图，告诉朋友路线 |\n| 上午 | 按舒服的速度走，遇到岔路核对地图 |\n| 中途 | 在允许休息的地方吃午餐 |\n| 返回 | 留出比预计更多的时间 |\n\n### 随身物品\n\n- 足够的饮水和小零食\n- 防雨外套与舒适的鞋\n- 离线地图和充好电的手机\n- 简单急救用品\n\n不必追求走得远。观察树叶、听鸟鸣，也是这次散步的重要部分。'),
    conversation('os', 'Operating systems: threads & synchronization', 'claude', ['programming', 'learning'], '2026-11-10', 'Understanding mutexes, race conditions, and condition variables with a small producer–consumer example.', 'Why does a producer–consumer implementation sometimes deadlock?', '## Start with the shared state\n\nA condition variable does not remember a signal. Test the predicate while holding the mutex, and use a `while` loop rather than an `if`.\n\n```c\npthread_mutex_lock(&mutex);\nwhile (count == 0) {\n    pthread_cond_wait(&not_empty, &mutex);\n}\nconsume(buffer[--count]);\npthread_cond_signal(&not_full);\npthread_mutex_unlock(&mutex);\n```\n\nThe wait operation releases the lock atomically. After waking, the consumer reacquires it and checks that the buffer is still non-empty.\n\n### Debugging checklist\n\n1. Protect the buffer and its count with the same mutex.\n2. Signal after changing the predicate.\n3. Never join a worker while holding a lock it needs.'),
    conversation('recipe', '家常料理：番茄炖白豆', 'manual', ['cooking', 'recipes'], '2026-11-08', '一锅简单的番茄白豆，搭配面包或米饭都合适。', '', '## 番茄炖白豆\n\n**两人份 · 约 30 分钟**\n\n### 食材\n\n- 熟白豆 1 罐，沥干\n- 番茄 3 个，洋葱半个\n- 大蒜 2 瓣\n- 番茄膏 1 大勺\n- 橄榄油、盐与黑胡椒\n\n### 做法\n\n1. 把洋葱切丁，用少量橄榄油炒软。\n2. 加入蒜末和番茄膏，炒出香味。\n3. 加入切块番茄和白豆，再倒入少量水。\n4. 小火煮到汤汁稍浓，最后调味。\n\n可以撒一点欧芹，配烤面包。'),
    conversation('reading', 'Keeping a small reading notebook', 'manual', ['books', 'reading'], '2026-11-03', 'A few lines about a character, a question, or a passage worth returning to.', '', '## Read first, collect less\n\nA reading notebook does not need to summarize every chapter. Keep the details that make you want to return to the book.\n\n- Note a character whose choices surprised you.\n- Write down a question the story leaves open.\n- Record a passage with its page number.\n\n### After finishing\n\nWrite a short paragraph about what stayed with you. Leave space to add a different impression when you reread it.'),
    conversation('react', 'A simpler approach to React Query caching', 'mcp', ['programming', 'learning'], '2026-10-28', 'Query keys, stale time, and invalidation without making things complicated.', 'What is a sensible cache strategy for a small notes app?', '## Make the query key describe the data\n\n```ts\nconst key = ["conversations", { tag, source }];\n```\n\nUse a modest `staleTime` for reads and invalidate after a successful mutation. Keep list and detail keys separate.\n\nA cache is an optimization, not a second database. Let the API be the source of truth.'),
    conversation('daypack', 'Packing a light day-hike bag', 'claude', ['hiking', 'outdoors'], '2026-10-24', 'A practical checklist for a short marked trail, adjusted for weather and terrain.', 'What should I pack for a short day hike?', '## Start with the conditions\n\nCheck the distance, terrain, weather, and available water before you pack. A short trail can still require extra preparation.\n\n### The essentials\n\n- Water and enough food for the outing, plus a little extra\n- A map and a reliable way to navigate\n- Sun protection and an extra layer\n- A rain shell when appropriate\n- A small first-aid kit, whistle, and headlamp\n\nTell someone your route and expected return time. Stay on marked trails and turn back if the conditions no longer feel manageable.'),
    conversation('book', '《看不见的城市》读书摘记', 'chat', ['books', 'reading'], '2026-10-19', '城市不只是建筑，也是记忆、愿望与人与人之间的联系。', '为什么《看不见的城市》读起来像一组梦？', '卡尔维诺用一座座虚构的城市，把我们对真实城市的感受拆开来看。\n\n## 三个反复出现的主题\n\n**记忆**：我们记住的并不是地图，而是在某个路口发生的事。\n\n**欲望**：每座城都承载着一种没有完成的愿望。\n\n**关系**：城市的意义存在于人、物与空间之间。\n\n阅读时不必追求完整的故事。每天读两三座城市，像散步一样。'),
    conversation('hike', 'An easy walk along the coast', 'chatgpt', ['hiking', 'outdoors'], '2026-10-11', 'A short coastal trail, a packed lunch, and time to enjoy the view.', 'How can I plan a relaxed coastal hike?', '## Keep the route simple\n\nChoose a short, marked coastal trail and leave room for breaks. Check local access notices before leaving.\n\n- Review the weather and tide information.\n- Stay away from unstable cliff edges.\n- Bring water, a wind layer, and sun protection.\n- Download a map before setting out.\n\nIf the conditions change, turn back. The walk does not need to reach a particular viewpoint to be worthwhile.'),
    conversation('python', 'Python 小练习：按类型整理文件', 'mcp', ['programming', 'learning'], '2026-09-26', '先打印分类计划，再考虑移动文件，避免覆盖同名文件。', '怎样用 Python 按文件类型分类，并先预览结果？', '## 先做 dry run\n\n第一版只打印计划，不移动任何文件。\n\n```python\nfrom pathlib import Path\n\nfolder = Path("example_files")\nfor file in folder.iterdir():\n    if file.is_file():\n        category = file.suffix.lower() or "other"\n        print(file.name, "->", category)\n```\n\n用一个只包含测试文件的目录练习。确认分类规则后，再加入移动操作。遇到重名文件时不要覆盖，而是加一个编号。'),
    conversation('bread', 'Baking a simple loaf of bread', 'chatgpt', ['cooking', 'baking'], '2026-09-18', 'Flour, water, yeast, and salt: a straightforward loaf with time to rise.', 'What is a basic bread recipe for a beginner?', '## A small everyday loaf\n\n| Ingredient | Amount |\n| --- | --- |\n| Bread flour | 500 g |\n| Water | 325 g |\n| Instant yeast | 7 g |\n| Salt | 10 g |\n\n1. Mix the ingredients until no dry flour remains.\n2. Knead until the dough becomes smooth and elastic.\n3. Cover and let it rise until roughly doubled in size.\n4. Shape, place in a loaf tin, and let it rise again.\n5. Bake in a preheated oven at 220°C for about 30–35 minutes, adjusting for your oven.\n\nLet the loaf cool before slicing. A slower rise in a cooler room is normal.'),
    conversation('bookclub', '给读书小组的讨论问题', 'manual', ['books', 'reading'], '2026-09-05', '从人物、叙述方式和一个难忘的场景开始讨论，不必寻找唯一答案。', '', '## 三个讨论起点\n\n1. 哪个人物的决定让你最意外？\n2. 如果换一个叙述者，故事会有什么不同？\n3. 哪个场景最值得重新阅读？\n\n### 留给不同的感受\n\n有人喜欢语言，有人关注情节，也有人记住一个很小的细节。讨论时可以回到具体段落，听听不同读者为什么产生不同印象。\n\n最后，每个人推荐一本相关的书，并用一句话说明理由。'),
  ]);
}
function markArchived(list: Conversation[]): Conversation[] {
  return list.map(c => c.id === 'bookclub' ? { ...c, archived: true, archived_at: date('2026-11-01') } : c);
}
