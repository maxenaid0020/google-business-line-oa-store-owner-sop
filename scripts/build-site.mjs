import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src/content-source.html');
const outputPaths = [
  path.join(root, 'index.html'),
  path.join(root, '10-完整Google商家註冊圖文教學.html'),
];

const source = fs.readFileSync(sourcePath, 'utf8');
const title = source.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() ?? '完整 Google 商家註冊圖文教學';
const body = source.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1]?.trim();

if (!body) {
  throw new Error('Unable to extract body HTML from source file.');
}

const stripTags = (value) => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const [introRaw = '', ...contentParts] = body.split(/<hr\s*\/?\s*>/i);
let contentHtml = contentParts.join('\n<hr>\n').trim();

const publishedDate = introRaw.match(/<p>日期：([^<]+)<\/p>/)?.[1]?.trim() ?? '';
const heroCards = [];
const cardRegex = /<p>([^<]+?)<\/p>\s*((?:<(?:ul|ol)>[\s\S]*?<\/(?:ul|ol)>))/g;
let cardMatch;
while ((cardMatch = cardRegex.exec(introRaw)) !== null) {
  const label = stripTags(cardMatch[1]).replace(/：$/, '');
  if (!label || label === title || label === `日期：${publishedDate}` || label === '日期') continue;
  heroCards.push({ label, listHtml: cardMatch[2] });
}

const figureCount = (contentHtml.match(/<figure>/g) ?? []).length;
const stepCount = (contentHtml.match(/<h2>Step /g) ?? []).length;

let headingCount = 0;
const headings = [];
contentHtml = contentHtml.replace(/<(h[2-4])>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
  headingCount += 1;
  const level = Number(tag[1]);
  const text = stripTags(inner);
  const id = `section-${String(headingCount).padStart(2, '0')}`;
  headings.push({ level, text, id });
  const permalink = `<a href="#${id}" class="ml-3 hidden rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-400 shadow-sm transition hover:border-sky-300 hover:text-sky-600 group-hover:inline-flex" aria-label="連到 ${escapeHtml(text)}">#</a>`;
  return `<${tag} id="${id}" class="group">${inner}${permalink}</${tag}>`;
});

contentHtml = contentHtml.replace(/<img\b(?![^>]*\bloading=)([^>]*?)>/g, '<img loading="lazy" $1>');

const h2Headings = headings.filter((heading) => heading.level === 2);
const tocItems = headings
  .filter((heading) => heading.level <= 3)
  .map((heading) => {
    const label = escapeHtml(heading.text.replace(/^Step\s+\d+：/, ''));
    return `<a class="toc-link" data-toc-link data-level="${heading.level}" href="#${heading.id}">${label}</a>`;
  })
  .join('\n');

const sectionChips = h2Headings
  .map((heading) => `<a class="section-chip" href="#${heading.id}">${escapeHtml(heading.text)}</a>`)
  .join('\n');

const cardTone = (label) => {
  if (label.includes('重要')) {
    return {
      shell: 'border-rose-200 bg-rose-50/90',
      badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
      title: 'text-rose-900',
    };
  }
  if (label.includes('目標')) {
    return {
      shell: 'border-sky-200 bg-sky-50/90',
      badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
      title: 'text-sky-900',
    };
  }
  return {
    shell: 'border-emerald-200 bg-emerald-50/90',
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    title: 'text-emerald-900',
  };
};

const introCardsHtml = heroCards
  .map(({ label, listHtml }) => {
    const tone = cardTone(label);
    return `
      <section class="rounded-3xl border ${tone.shell} p-6 shadow-sm shadow-slate-200/70">
        <div class="inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-[0.24em] uppercase ${tone.badge}">${escapeHtml(label)}</div>
        <div class="mt-4 text-[1.02rem] leading-8 text-slate-700 [&_ul]:space-y-3 [&_ul]:pl-6 [&_ul]:marker:text-sky-500 [&_ol]:space-y-3 [&_ol]:pl-6 [&_ol]:marker:text-sky-500 [&_li]:pl-1 ${tone.title}">
          ${listHtml}
        </div>
      </section>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="完整整理 Google 商家註冊、驗證準備、圖文步驟與常見卡關，提供清楚易讀的 SOP 教學。">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet">
    <link href="./assets/site.css" rel="stylesheet">
  </head>
  <body class="min-h-screen bg-slate-950 text-slate-900 antialiased">
    <div class="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)]">
      <div class="absolute inset-x-0 top-0 -z-10 h-56 bg-[linear-gradient(120deg,_rgba(15,23,42,0.92),_rgba(15,118,110,0.78),_rgba(14,165,233,0.36))]"></div>
      <header class="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-14 lg:pt-16">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_22rem] lg:items-start">
          <div>
            <div class="rounded-[2rem] border border-white/15 bg-slate-950/22 p-6 shadow-2xl shadow-slate-950/15 backdrop-blur-md sm:p-8">
              <div class="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white/90 shadow-lg shadow-slate-950/10 backdrop-blur">
                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
                店主可直接照做的 Google 商家教學
              </div>
              <h1 class="mt-6 max-w-5xl break-keep text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">${escapeHtml(title)}</h1>
              <p class="mt-6 max-w-3xl text-lg leading-8 text-slate-100 sm:text-xl">
                這份頁面把 Google 商家註冊、驗證準備、後續補齊與常見卡關整理成一份更好讀、可快速跳段的操作指南。
              </p>
              <div class="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
                <span class="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-slate-200">${publishedDate ? `更新於 ${escapeHtml(publishedDate)}` : '最新版內容'}</span>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-slate-200">${h2Headings.length} 個章節</span>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-slate-200">${stepCount} 個步驟</span>
                <span class="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-slate-200">${figureCount} 張示意圖</span>
              </div>
              <div class="mt-8 flex flex-wrap gap-3">
                <a href="#content" class="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-xl shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-100">開始閱讀</a>
                <a href="#toc" class="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/18">快速看目錄</a>
              </div>
            </div>
          </div>
          <aside class="rounded-[2rem] border border-white/20 bg-white/14 p-6 text-white shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
            <p class="text-xs font-bold uppercase tracking-[0.28em] text-sky-100">閱讀方式</p>
            <ul class="mt-4 space-y-4 text-sm leading-7 text-slate-50/92">
              <li>先用右側目錄快速跳到你要處理的章節。</li>
              <li>若你是第一次註冊，建議從「先確認能不能申請」一路讀到驗證完成。</li>
              <li>若你已經卡在某一步，可直接跳到對應的 Step 段落或常見問題。</li>
            </ul>
          </aside>
        </div>
        <div class="mt-10 flex flex-wrap gap-3">
          ${sectionChips}
        </div>
      </header>
    </div>

    <main class="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div class="space-y-8">
          <section class="grid gap-5 md:grid-cols-3">
            ${introCardsHtml}
          </section>

          <article id="content" class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.35)]">
            <div class="border-b border-slate-200 bg-slate-50/90 px-6 py-5 sm:px-10">
              <div class="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span class="rounded-full bg-slate-900 px-3 py-1 text-white">SOP 教學</span>
                <span>依章節分段</span>
                <span>・</span>
                <span>保留全部原始圖文內容</span>
              </div>
            </div>
            <div class="doc-content px-6 py-8 text-[1.04rem] leading-8 text-slate-700 sm:px-10 sm:py-10
              [&_a]:font-semibold [&_a]:text-sky-700 [&_a]:decoration-sky-200 [&_a]:underline-offset-4 hover:[&_a]:text-sky-800 hover:[&_a]:decoration-sky-400
              [&_h2]:mt-16 [&_h2]:flex [&_h2]:items-center [&_h2]:text-pretty [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-4 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-slate-950
              [&_h3]:mt-10 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-slate-900
              [&_h4]:mt-8 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-slate-900
              [&_p]:mt-5 [&_p]:text-pretty
              [&_ul]:mt-4 [&_ul]:space-y-3 [&_ul]:pl-6 [&_ul]:marker:text-sky-500
              [&_ol]:mt-4 [&_ol]:space-y-3 [&_ol]:pl-6 [&_ol]:marker:font-semibold [&_ol]:marker:text-sky-500
              [&_li]:pl-1
              [&_hr]:my-14 [&_hr]:h-px [&_hr]:border-0 [&_hr]:bg-gradient-to-r [&_hr]:from-transparent [&_hr]:via-slate-300 [&_hr]:to-transparent
              [&_figure]:my-10 [&_figure]:overflow-hidden [&_figure]:rounded-[1.75rem] [&_figure]:border [&_figure]:border-slate-200 [&_figure]:bg-slate-50 [&_figure]:shadow-xl [&_figure]:shadow-slate-200/70
              [&_img]:w-full [&_img]:bg-white [&_img]:object-cover
              [&_figcaption]:border-t [&_figcaption]:border-slate-200 [&_figcaption]:bg-white/85 [&_figcaption]:px-5 [&_figcaption]:py-4 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:leading-6 [&_figcaption]:text-slate-500
              [&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em] [&_code]:font-semibold [&_code]:text-slate-900
              [&_strong]:font-extrabold [&_strong]:text-slate-950">
              ${contentHtml}
            </div>
          </article>
        </div>

        <aside class="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <section id="toc" class="rounded-[2rem] bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-slate-900/25 ring-1 ring-slate-800/80">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-black tracking-tight text-white">快速目錄</h2>
              <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">${headings.length} 項</span>
            </div>
            <nav class="mt-4 space-y-1">
              ${tocItems}
            </nav>
          </section>

          <section class="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/70">
            <h2 class="text-lg font-black tracking-tight text-slate-950">閱讀提示</h2>
            <ul class="mt-4 space-y-3 text-sm leading-7 text-slate-600 marker:text-sky-500">
              <li>先備資料與驗證準備最好一次整理好，再開始建立商家。</li>
              <li>如果畫面跟截圖不同，優先依 Google 當下實際流程操作。</li>
              <li>需要回頭找某張示意圖時，可以直接用瀏覽器搜尋 Step。</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>

    <button id="back-to-top" class="fixed bottom-5 right-5 hidden rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-900/30 transition hover:-translate-y-0.5 hover:bg-slate-800">回到頂部</button>

    <script>
      const links = Array.from(document.querySelectorAll('[data-toc-link]'));
      const sections = links
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
      const linkById = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.target.offsetTop - b.target.offsetTop)[0];
        if (!visible) return;
        for (const link of links) link.dataset.active = 'false';
        const activeLink = linkById.get(visible.target.id);
        if (activeLink) activeLink.dataset.active = 'true';
      }, { rootMargin: '-20% 0px -70% 0px', threshold: [0, 1] });
      sections.forEach((section) => observer.observe(section));

      const backToTop = document.getElementById('back-to-top');
      const toggleBackToTop = () => {
        if (window.scrollY > 640) {
          backToTop.classList.remove('hidden');
        } else {
          backToTop.classList.add('hidden');
        }
      };
      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      toggleBackToTop();
      backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    </script>
  </body>
</html>`;

for (const outputPath of outputPaths) {
  fs.writeFileSync(outputPath, html);
}
