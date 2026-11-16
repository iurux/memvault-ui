export type Source = 'claude' | 'chatgpt' | 'mcp' | 'chat' | 'manual';
export interface Message { role: 'user' | 'assistant' | 'note'; content: string; created_at: string }
export interface ConversationSummary { id: string; title: string; source: Source; tags: string[]; created_at: string; snippet: string }
export interface Conversation extends ConversationSummary { messages: Message[] }

const date = (day: string) => `${day}T10:30:00Z`;
function conversation(id: string, title: string, source: Source, tags: string[], day: string, snippet: string, question: string, answer: string): Conversation {
  return { id, title, source, tags, created_at: date(day), snippet, messages: question ? [{ role: 'user', content: question, created_at: date(day) }, { role: 'assistant', content: answer, created_at: date(day) }] : [{ role: 'note', content: answer, created_at: date(day) }] };
}
export function createSampleConversations(): Conversation[] {
  return [
    conversation('opt', 'OPT application timeline & checklist', 'claude', ['life', 'immigration'], '2026-11-14', 'A clear timeline for applying for post-completion OPT, from the I-20 request to your first day of work.', 'I’m graduating in May. Can you help me map out the post-completion OPT timeline and what I need to prepare?', `Absolutely. Here’s a practical timeline to work backward from your graduation date. The key is to leave enough room for your school’s processing time and the USCIS application window.

## The timeline

Assuming your program ends on **May 15**, here’s how the pieces fit together:

| When | What to do | Notes |
| --- | --- | --- |
| Mid-February | Request your OPT I-20 | Check your school’s process with your DSO. |
| February 14 onward | Earliest filing window | Up to 90 days before your program ends. |
| March – April | Submit Form I-765 | File within 30 days of the DSO recommendation. |
| May 15 | Program end date | Your 60-day grace period begins. |
| May 16 – July 14 | Choose an OPT start date | Pick a date within the allowed window. |
| By July 14 | Latest filing deadline | USCIS must receive your application in time. |

## Before you apply

- A new I-20 with the OPT recommendation
- A copy of your passport and F-1 visa
- Your most recent I-94 record
- A recent passport-style photo
- Any previous EAD cards, if applicable
- The current I-765 filing fee

> Don’t start working until your EAD has arrived **and** the start date printed on it has passed.

## A few things to keep in mind

You can apply before you have a job offer. Once OPT starts, keep track of unemployment days and report changes through your school or the SEVP portal.

These dates are illustrative, not legal advice. Always confirm current requirements with your DSO and the [USCIS OPT guidance](https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students).`),
    conversation('europe', '两周欧洲旅行：巴黎、阿姆斯特丹与哥本哈根', 'chatgpt', ['travel', 'planning'], '2026-11-12', '慢一点的旅行路线，留出散步、咖啡馆和不做计划的时间。', '想用两周去巴黎、阿姆斯特丹和哥本哈根，不想每天都赶景点。帮我规划一下？', '## 一条不赶路的路线\n\n把两周分成三个小段：**巴黎 5 天、阿姆斯特丹 4 天、哥本哈根 4 天**，最后留一天返程。\n\n| 城市 | 重点 | 留白 |\n| --- | --- | --- |\n| 巴黎 | 奥赛博物馆、玛黑区 | 塞纳河边散步 |\n| 阿姆斯特丹 | 运河、梵高博物馆 | 找一家喜欢的咖啡馆 |\n| 哥本哈根 | 路易斯安那美术馆 | 骑车去海边 |\n\n巴黎到阿姆斯特丹可以坐火车，之后飞往哥本哈根。每座城市只提前订一个重要景点，其他时间随心走。\n\n### 行李清单\n\n- 一双舒适的步行鞋\n- 防雨外套与薄毛衣\n- 欧洲转换插头\n- 护照、保险和预订的离线副本'),
    conversation('os', 'Operating systems lab: threads & synchronization', 'claude', ['learning', 'code'], '2026-11-10', 'Understanding mutexes, race conditions, and why the producer–consumer pattern needs a condition variable.', 'Why does my producer–consumer implementation occasionally deadlock?', '## Start with the shared state\n\nA condition variable does not remember a signal. Always test the predicate while holding the mutex, and use a `while` loop rather than an `if`.\n\n```c\npthread_mutex_lock(&mutex);\nwhile (count == 0) {\n    pthread_cond_wait(&not_empty, &mutex);\n}\nconsume(buffer[--count]);\npthread_cond_signal(&not_full);\npthread_mutex_unlock(&mutex);\n```\n\nThe wait operation releases the lock atomically. After waking, the consumer reacquires it and checks that the buffer is still non-empty.\n\n### Debugging checklist\n\n1. Use one mutex to protect both the buffer and its count.\n2. Signal after changing the predicate.\n3. Never join a worker while holding a lock it needs.'),
    conversation('recipe', '周末厨房：番茄炖牛肉', 'manual', ['food', 'life'], '2026-11-08', '一锅慢炖的番茄牛肉，第二天拌面更好吃。', '', '## 番茄炖牛肉\n\n**两人份 · 准备 20 分钟 · 慢炖 90 分钟**\n\n### 食材\n\n- 牛腩 500 克\n- 番茄 3 个，洋葱半个\n- 胡萝卜 1 根\n- 番茄膏 1 大勺\n- 月桂叶 2 片\n\n### 做法\n\n1. 牛肉切块，擦干后煎到表面金黄。\n2. 炒软洋葱，加入番茄膏，再加入切块番茄。\n3. 放回牛肉，加入刚好没过食材的水。\n4. 小火炖 90 分钟，最后加盐和黑胡椒。\n\n留一半明天拌面，汤汁会更浓。'),
    conversation('reading', 'Notes on a quieter digital life', 'manual', ['life', 'ideas'], '2026-11-03', 'Keep the things that matter. Let the rest pass through.', '', '## Less collecting, more returning\n\nA good archive is not a place to put everything. It is a place to return to the things that changed how you think.\n\n- Keep a small reading list.\n- Write a sentence about why something matters.\n- Revisit old notes before collecting new ones.\n\n**Question for next month:** What have I actually used from what I saved?'),
    conversation('react', 'A simpler approach to React Query caching', 'mcp', ['code', 'learning'], '2026-10-28', 'Query keys, stale time, and invalidation without making things complicated.', 'What is a sensible cache strategy for a small notes app?', '## Make the query key describe the data\n\n```ts\nconst key = ["conversations", { tag, source }];\n```\n\nUse a modest `staleTime` for reads and invalidate after a successful mutation. Keep list and detail keys separate.\n\nA cache is an optimization, not a second database. Let the API be the source of truth.'),
    conversation('career', 'Preparing for a thoughtful design interview', 'claude', ['work', 'planning'], '2026-10-24', 'A few stories worth preparing, and questions that reveal how a team really works.', 'Help me prepare for a product design interview.', '## Three stories to have ready\n\n1. A decision you changed after listening to users.\n2. A project where constraints improved the outcome.\n3. A disagreement you resolved with evidence.\n\nFor each, explain the context, your contribution, and what you would do differently.\n\n### Questions for the team\n\n- How do you decide what not to build?\n- When did research last change the roadmap?\n- What makes a successful first three months?'),
    conversation('book', '《看不见的城市》读书摘记', 'chat', ['books', 'ideas'], '2026-10-19', '城市不只是建筑，也是记忆、愿望与人与人之间的联系。', '为什么《看不见的城市》读起来像一组梦？', '卡尔维诺用一座座虚构的城市，把我们对真实城市的感受拆开来看。\n\n## 三个反复出现的主题\n\n**记忆**：我们记住的并不是地图，而是在某个路口发生的事。\n\n**欲望**：每座城都承载着一种没有完成的愿望。\n\n**关系**：城市的意义存在于人、物与空间之间。\n\n阅读时不必追求完整的故事。每天读两三座城市，像散步一样。'),
    conversation('hike', 'A weekend on the coast', 'chatgpt', ['travel', 'life'], '2026-10-11', 'An easy coastal walk, a packed lunch, and a day away from screens.', 'Plan a low-key day trip along the California coast.', '## Keep the day simple\n\nStart early, choose a short coastal trail, and bring lunch. Leave the afternoon open.\n\n- Check tide and weather conditions.\n- Bring water, a wind layer, and sunscreen.\n- Download the trail map before you leave.\n\nIf the weather changes, trade the hike for a café and a bookstore. The point is the pause, not the itinerary.'),
    conversation('python', 'Python 小工具：整理下载文件夹', 'mcp', ['code', 'ideas'], '2026-09-26', '按文件类型分类，先预览，再移动，避免误操作。', '想写一个脚本整理下载文件夹，但是怕把文件弄乱。', '## 先做 dry run\n\n第一版只打印计划，不移动任何文件。\n\n```python\nfrom pathlib import Path\n\nfolder = Path.home() / "Downloads"\nfor file in folder.iterdir():\n    if file.is_file():\n        category = file.suffix.lower() or "other"\n        print(file.name, "->", category)\n```\n\n确认分类规则后，再加入移动操作。遇到重名文件时不要覆盖，而是加一个编号。'),
    conversation('coffee', 'Dialing in a better morning coffee', 'chatgpt', ['food', 'learning'], '2026-09-18', 'Change one variable at a time: grind, ratio, then temperature.', 'My pour-over tastes a little sour. Where should I start?', 'Sourness often points to under-extraction. Try grinding a little finer before changing anything else.\n\n| Variable | Starting point |\n| --- | --- |\n| Coffee | 15 g |\n| Water | 250 g |\n| Temperature | 94°C |\n| Total time | 2:30–3:00 |\n\nKeep a small note each morning. Change only one variable, then taste again.'),
    conversation('semester', '秋季学期的每周安排', 'manual', ['planning', 'learning'], '2026-09-05', '把课程、实验和休息都放进日历，但不要把每一分钟填满。', '', '## 一周的节奏\n\n周一和周三集中上课，周二下午留给实验，周五做一周回顾。\n\n### 每周固定的三件事\n\n- 复习一门最难的课\n- 完成一项实验的最小版本\n- 留出一个完全没有任务的晚上\n\n计划是为了让生活更轻松，不是为了制造更多压力。'),
  ];
}
