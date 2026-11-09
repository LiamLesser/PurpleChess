document.addEventListener("DOMContentLoaded",()=>{f()});function f(){y(),m(),v(),w(),k();const e=document.getElementById("year");e&&(e.textContent=new Date().getFullYear().toString())}function k(){const e=document.getElementById("rankModal"),a=document.getElementById("rankModalBody"),t=document.getElementById("rankModalClose"),n=e==null?void 0:e.querySelector(".rank-modal-overlay");if(!e||!a)return;document.querySelectorAll("[data-rank-details]").forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.rankDetails;s&&u(s)})}),t==null||t.addEventListener("click",c),n==null||n.addEventListener("click",c),document.addEventListener("keydown",i=>{i.key==="Escape"&&e.classList.contains("active")&&c()})}function u(e){const a=document.getElementById("rankModal"),t=document.getElementById("rankModalBody"),n=document.getElementById(`rank-details-${e}`);!a||!t||!n||(t.innerHTML=n.innerHTML,a.classList.add("active"),document.body.style.overflow="hidden")}function c(){const e=document.getElementById("rankModal");e&&(e.classList.remove("active"),document.body.style.overflow="")}function y(){document.querySelectorAll(".wiki-link, [data-navigate]").forEach(a=>{a.addEventListener("click",t=>{const n=a.dataset.article||a.dataset.navigate;n&&(t.preventDefault(),r(n))})})}function r(e){var n;document.querySelectorAll(".wiki-article").forEach(o=>o.classList.remove("active"));const t=document.getElementById(e);t&&(t.classList.add("active"),t.style.opacity="0",t.style.transform="translateY(20px)",requestAnimationFrame(()=>{t.style.transition="opacity 0.4s ease, transform 0.4s ease",t.style.opacity="1",t.style.transform="translateY(0)"}),history.pushState(null,"",`#${e}`),h(e),(n=document.querySelector(".wiki-content"))==null||n.scrollTo(0,0))}function h(e){document.querySelectorAll(".wiki-link").forEach(t=>{t.classList.remove("active")});const a=document.querySelector(`.wiki-link[data-article="${e}"]`);if(a){a.classList.add("active");const t=a.closest(".wiki-category");if(t){const n=t.querySelector(".wiki-category-header");n&&!n.classList.contains("active")&&n.classList.add("active")}}}function m(){document.querySelectorAll(".wiki-category-header").forEach(a=>{a.addEventListener("click",()=>{a.classList.toggle("active")})})}function v(){const e=document.getElementById("wikiSearch");e&&e.addEventListener("input",a=>{const n=a.target.value.toLowerCase().trim();g(n)})}function g(e){const a=document.querySelectorAll(".wiki-link"),t=document.querySelectorAll(".wiki-category");if(!e){a.forEach(n=>n.style.display=""),t.forEach(n=>n.style.display="");return}t.forEach(n=>{var s;const o=n.querySelectorAll(".wiki-link");let i=!1;o.forEach(l=>{var d;(((d=l.textContent)==null?void 0:d.toLowerCase())??"").includes(e)?(l.style.display="",i=!0):l.style.display="none"}),n.style.display=i?"":"none",i&&((s=n.querySelector(".wiki-category-header"))==null||s.classList.add("active"))})}function w(){const e=window.location.hash.slice(1);e&&r(e),window.addEventListener("hashchange",()=>{const a=window.location.hash.slice(1);a&&r(a)})}async function p(e){try{const t=await(await fetch(e)).json();return Array.isArray(t)?t:t.articles||[]}catch(a){return console.error("Failed to load articles:",a),[]}}async function E(e){try{const t=await(await fetch(e)).json();return Array.isArray(t)?t:t.categories||[]}catch(a){return console.error("Failed to load categories:",a),[]}}function L(e,a){const t=document.getElementById("wikiNav");t&&(t.innerHTML=e.map(n=>{const o=a.filter(i=>i.category===n.id);return`
      <div class="wiki-category" data-category="${n.id}">
        <button class="wiki-category-header">
          <i class="${n.icon}"></i>
          <span>${n.name}</span>
          <i class="fas fa-chevron-down wiki-chevron"></i>
        </button>
        <ul class="wiki-category-items">
          ${o.map(i=>`
            <li><a href="#${i.id}" class="wiki-link" data-article="${i.id}">${i.title}</a></li>
          `).join("")}
        </ul>
      </div>
    `}).join(""),m(),y())}function A(e){const a=document.getElementById("wikiContent");if(!a)return;const t=document.createElement("article");t.className="wiki-article",t.id=e.id,t.dataset.articleId=e.id,t.innerHTML=`
    <header class="wiki-article-header">
      <div class="wiki-breadcrumb">
        <span>${e.categoryName||"Wiki"}</span>
        <i class="fas fa-chevron-right"></i>
        <span>${e.title}</span>
      </div>
      <h1>${e.title}</h1>
      <div class="wiki-article-meta">
        <span><i class="fas fa-clock"></i> Last updated: <time>${e.updated}</time></span>
      </div>
    </header>
    <div class="wiki-article-body">
      ${e.content}
    </div>
  `,a.appendChild(t)}window.VoidsentWiki={navigateToArticle:r,loadArticlesFromAPI:p,loadCategoriesFromAPI:E,renderCategories:L,renderArticle:A,openRankModal:u,closeRankModal:c};
