let sideTableDialogRedirectHref = null;
let sideTableDialogOnClose = null;

function showSideTableMessage(message, options) {
  const opts = options || {};
  sideTableDialogRedirectHref = opts.redirectAfterClose || null;
  sideTableDialogOnClose = typeof opts.onClose === "function" ? opts.onClose : null;

  let overlay = document.getElementById("side-table-dialog-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "side-table-dialog-overlay";
    overlay.className = "side-table-dialog-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <div class="side-table-dialog" role="dialog" aria-modal="true" aria-labelledby="side-table-dialog-title">
        <h2 id="side-table-dialog-title" class="side-table-dialog-title">Side Table</h2>
        <p class="side-table-dialog-message"></p>
        <button type="button" class="side-table-dialog-close">OK</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      const href = sideTableDialogRedirectHref;
      sideTableDialogRedirectHref = null;
      const onClose = sideTableDialogOnClose;
      sideTableDialogOnClose = null;
      if (onClose) {
        onClose();
      }
      if (href) {
        window.location.assign(href);
      }
    };

    overlay.querySelector(".side-table-dialog-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  overlay.querySelector(".side-table-dialog-message").innerHTML = message;
  overlay.classList.add("is-open");
  overlay.removeAttribute("aria-hidden");
}

const emailForm = document.getElementById("emailForm");
const surveyForm = document.getElementById("surveyForm");
const GOOGLE_SHEETS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxrxFOSr92H96h9P6A6aUdGN_KDDBGABK2bAoTO1ZIjImsOBD3PFqgIGPzGba1T5lv0/exec";

function sheetsEndpointConfigured() {
  return (
    GOOGLE_SHEETS_WEB_APP_URL &&
    !GOOGLE_SHEETS_WEB_APP_URL.includes("REPLACE_WITH_YOUR_DEPLOYMENT_ID")
  );
}

function setSurveySubmitLoading(isLoading) {
  let el = document.getElementById("survey-submit-overlay");
  if (isLoading) {
    if (!el) {
      el = document.createElement("div");
      el.id = "survey-submit-overlay";
      el.className = "survey-submit-overlay";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-busy", "true");
      el.innerHTML = `
        <div class="survey-submit-overlay-inner">
          <div class="survey-submit-spinner" aria-hidden="true"></div>
          <p class="survey-submit-overlay-text">Sending your responses…</p>
        </div>
      `;
      document.body.appendChild(el);
    }
    el.classList.add("is-visible");
    document.documentElement.classList.add("survey-submit-loading");
  } else {
    if (el) {
      el.classList.remove("is-visible");
      el.setAttribute("aria-busy", "false");
    }
    document.documentElement.classList.remove("survey-submit-loading");
  }
}

if (emailForm) {
  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(emailForm);
    const email = (formData.get("email") || "").toString().trim().toLowerCase();

    if (!email) {
      return;
    }

    const submittedAt = new Date().toISOString();
    const payload = {
      submissionType: "email",
      email,
      submittedAt,
    };

    if (sheetsEndpointConfigured()) {
      try {
        const submitResponse = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(payload),
        });

        if (!submitResponse.ok) {
          throw new Error("Failed to submit email to Google Sheets.");
        }
      } catch (error) {
        showSideTableMessage(
          "We could not save your email right now. Please try again."
        );
        return;
      }
    } else {
      const emailLeads = JSON.parse(localStorage.getItem("sideTableEmailLeads") || "[]");
      emailLeads.push({ email, submittedAt });
      localStorage.setItem("sideTableEmailLeads", JSON.stringify(emailLeads));
    }

    emailForm.reset();
    showSideTableMessage("We will keep you updated with our progress!");
  });
}

if (surveyForm) {
  surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = surveyForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setSurveySubmitLoading(true);
    try {
      const formData = new FormData(surveyForm);

      const response = {
        submissionType: "survey",
        drinkerType: (formData.get("drinkerType") || "").toString(),
        drinksOrdered: formData.getAll("drinksOrdered"),
        teasLoved: formData.getAll("teasLoved"),
        breakfastItems: formData.getAll("breakfastItems"),
        lunchItems: formData.getAll("lunchItems"),
        cakeFlavors: formData.getAll("cakeFlavors"),
        favoriteShops: (formData.get("favoriteShops") || "").toString().trim(),
        dietaryRestrictions: (formData.get("dietaryRestrictions") || "").toString().trim(),
        cafeElse: (formData.get("cafeElse") || "").toString().trim(),
        contactInfo: (formData.get("contactInfo") || "").toString().trim(),
        submittedAt: new Date().toISOString(),
      };

      if (sheetsEndpointConfigured()) {
        try {
          const submitResponse = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(response),
          });

          if (!submitResponse.ok) {
            throw new Error("Failed to submit survey to Google Sheets.");
          }
        } catch (error) {
          showSideTableMessage(
            "Darn, we're having some technical difficulties. Please try again."
          );
          return;
        }
      } else {
        const surveyResponses = JSON.parse(
          localStorage.getItem("sideTableSurveyResponses") || "[]"
        );
        surveyResponses.push(response);
        localStorage.setItem("sideTableSurveyResponses", JSON.stringify(surveyResponses));
      }

      surveyForm.reset();
      showSideTableMessage("Thanks for your opinion! We'll try to incorporate them!", {
        redirectAfterClose: "index.html",
      });
    } finally {
      setSurveySubmitLoading(false);
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

(function initSiteNavDrawer() {
  const toggle = document.getElementById("siteNavToggle");
  const drawer = document.getElementById("siteNavDrawer");
  const closeBtn = document.getElementById("siteNavDrawerClose");
  const backdrop = document.getElementById("siteNavDrawerBackdrop");
  const source = document.getElementById("primaryNavList");
  const target = document.getElementById("primaryNavDrawerList");

  if (!toggle || !drawer || !closeBtn || !backdrop || !source || !target) {
    return;
  }

  const mq = window.matchMedia("(max-width: 640px)");

  function copyNavIntoDrawer() {
    target.innerHTML = "";
    source.querySelectorAll("li").forEach((li) => {
      target.appendChild(li.cloneNode(true));
    });
  }

  function isMobileNav() {
    return mq.matches;
  }

  let previouslyFocused = null;

  function openDrawer() {
    if (!isMobileNav()) return;
    copyNavIntoDrawer();
    previouslyFocused = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("site-nav-drawer-open");
    closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("site-nav-drawer-open");
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
  }

  function onToggleClick() {
    if (drawer.classList.contains("is-open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  copyNavIntoDrawer();

  mq.addEventListener("change", () => {
    if (!isMobileNav()) {
      closeDrawer();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) {
      closeDrawer();
    }
  });

  toggle.addEventListener("click", onToggleClick);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });

  target.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && link.getAttribute("href")) {
      closeDrawer();
    }
  });
})();

(function initHomeReveal() {
  const roots = document.querySelectorAll(".page--home, .page--store");
  if (!roots.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (
    !reduceMotion &&
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined" &&
    document.querySelector(".page--home")
  ) {
    initCreativeScrollAnimations();
    return;
  }

  const revealSelector = ".reveal-h2, .reveal-img, .reveal-up";
  if (!reduceMotion) {
    const reveals = [];
    roots.forEach((root) => {
      root.querySelectorAll(revealSelector).forEach((el) => reveals.push(el));
    });
    if (!reveals.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );
    reveals.forEach((el) => io.observe(el));

    const hero = document.querySelector(".st-hero");
    if (hero) {
      requestAnimationFrame(() => {
        hero.querySelectorAll(".reveal-up, .reveal-h2, .reveal-img").forEach((el) => {
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      });
    }
  } else {
    roots.forEach((root) => {
      root.querySelectorAll(revealSelector).forEach((el) => el.classList.add("is-visible"));
    });
  }
})();

function getPageScrollY() {
  return document.body.scrollTop || document.documentElement.scrollTop || window.scrollY || 0;
}

function initScrollTriggerScroller() {
  const scroller = document.body;

  ScrollTrigger.scrollerProxy(scroller, {
    scrollTop(value) {
      if (arguments.length) {
        scroller.scrollTop = value;
      }
      return scroller.scrollTop;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  ScrollTrigger.defaults({ scroller });
  scroller.addEventListener("scroll", ScrollTrigger.update);

  let refreshTimer;
  const scheduleScrollRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  };

  window.addEventListener("resize", scheduleScrollRefresh);
  window.addEventListener("orientationchange", scheduleScrollRefresh);
  window.addEventListener("load", scheduleScrollRefresh);
}

function splitLineWords(selector) {
  document.querySelectorAll(selector).forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = "";
    text.split(/\s+/).forEach((word, i) => {
      const wrap = document.createElement("span");
      wrap.className = "split-word";
      const inner = document.createElement("span");
      inner.className = "split-inner";
      inner.textContent = word + (i < text.split(/\s+/).length - 1 ? "\u00a0" : "");
      wrap.appendChild(inner);
      line.appendChild(wrap);
    });
  });
}

function initMascotWalkScroll() {
  const walker = document.querySelector(".st-mascot-walker");
  const stage = document.querySelector(".st-mascot-stage");
  const hero = document.querySelector(".st-hero--brand");
  if (!walker || !stage || !hero) return;

  const parts = {
    legR: walker.querySelector(".st-mascot-layer--leg-right"),
    legL: walker.querySelector(".st-mascot-layer--leg-left"),
    armR: walker.querySelector(".st-mascot-layer--arm-right"),
    armL: walker.querySelector(".st-mascot-layer--arm-left"),
    body: walker.querySelector(".st-mascot-layer--body"),
    marks: walker.querySelector(".st-mascot-layer--marks"),
  };

  const pivot = {
    legR: "58.4% 59.8%",
    legL: "62.7% 59.7%",
    armR: "47.9% 42.3%",
    armL: "66.4% 44.4%",
    body: "50% 58%",
    marks: "21% 17%",
  };

  Object.entries(parts).forEach(([key, el]) => {
    if (el && pivot[key]) {
      gsap.set(el, { transformOrigin: pivot[key], force3D: true });
    }
  });

  gsap.set(walker, { x: 0 });

  const walk = gsap.timeline({
    paused: true,
    defaults: { duration: 0.75, ease: "sine.inOut" },
  });

  walk
    .to(parts.legR, { rotation: 22 }, 0)
    .to(parts.legL, { rotation: -18 }, 0)
    .to(parts.armR, { rotation: 16 }, 0)
    .to(parts.armL, { rotation: -14 }, 0)
    .to(parts.body, { y: -8, rotation: 1.2 }, 0)
    .to(parts.marks, { rotation: 8, scale: 1.06 }, 0)

    .to(parts.legR, { rotation: 2 }, 0.5)
    .to(parts.legL, { rotation: 2 }, 0.5)
    .to(parts.armR, { rotation: -2 }, 0.5)
    .to(parts.armL, { rotation: 2 }, 0.5)
    .to(parts.body, { y: -4, rotation: 0 }, 0.5)
    .to(parts.marks, { rotation: -3, scale: 1.01 }, 0.5)

    .to(parts.legR, { rotation: -18 }, 1)
    .to(parts.legL, { rotation: 20 }, 1)
    .to(parts.armR, { rotation: -12 }, 1)
    .to(parts.armL, { rotation: 10 }, 1)
    .to(parts.body, { y: -8, rotation: -1 }, 1)
    .to(parts.marks, { rotation: 6, scale: 1.06 }, 1)

    .to(parts.legR, { rotation: 0 }, 1.5)
    .to(parts.legL, { rotation: 0 }, 1.5)
    .to(parts.armR, { rotation: 0 }, 1.5)
    .to(parts.armL, { rotation: 0 }, 1.5)
    .to(parts.body, { y: 0, rotation: 0 }, 1.5)
    .to(parts.marks, { rotation: 0, scale: 1 }, 1.5);

  const walkCycles = 2;
  const walkTravelEnd = 0.92;
  let walkTravel = 0;

  const measureWalkTravel = () => {
    gsap.set(walker, { x: 0 });
    const heroInner = hero.querySelector(".st-hero-inner");
    if (!heroInner) return;

    const innerRect = heroInner.getBoundingClientRect();
    const walkerRect = walker.getBoundingClientRect();
    const targetLeft = innerRect.left + 12;

    walkTravel = Math.max(0, walkerRect.left - targetLeft);

    if (walkTravel < 12 && window.matchMedia("(max-width: 900px)").matches) {
      walkTravel = Math.max(walkTravel, heroInner.clientWidth * 0.24);
    }
  };

  measureWalkTravel();

  const getWalkProgress = (scrollProgress) => {
    const t = Math.min(scrollProgress / walkTravelEnd, 1);
    return Math.pow(t, 1.45);
  };

  const getWalkScrollStart = () => {
    const docTop = hero.getBoundingClientRect().top + getPageScrollY();
    return `top ${Math.round(docTop)}px`;
  };

  ScrollTrigger.create({
    trigger: hero,
    start: getWalkScrollStart,
    end: "+=580vh",
    scrub: 1.4,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const p = self.progress;
      walk.progress((p * walkCycles) % 1);
      gsap.set(walker, { x: -getWalkProgress(p) * walkTravel });
    },
  });

  ScrollTrigger.addEventListener("refreshInit", measureWalkTravel);
}

function initHeroPatternScroll() {
  const hero = document.querySelector(".st-hero--brand");
  if (!hero) return;

  const getShift = () => hero.offsetHeight;

  const getWalkScrollStart = () => {
    const docTop = hero.getBoundingClientRect().top + getPageScrollY();
    return `top ${Math.round(docTop)}px`;
  };

  gsap.to(hero, {
    "--hero-pattern-x": () => `${getShift()}px`,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: getWalkScrollStart,
      end: "bottom top",
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
}

function initShopPatternScroll() {
  const shop = document.querySelector(".page--home .st-shop");
  if (!shop) return;

  const getShift = () => shop.offsetHeight;

  gsap.to(shop, {
    "--shop-pattern-x": () => `${getShift()}px`,
    ease: "none",
    scrollTrigger: {
      trigger: shop,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
}

function initCreativeScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);
  initScrollTriggerScroller();
  document.documentElement.classList.add("js-gsap-active");

  splitLineWords(".js-split-line");

  const hero = document.querySelector(".st-hero--brand");
  if (!hero) return;

  gsap.set([".st-kicker", ".st-lede", ".st-hero-actions"], { opacity: 0, y: 32 });
  gsap.set(".split-inner", { opacity: 0, y: "110%" });
  gsap.set(".st-mascot-walker", { opacity: 0, y: 48, scale: 0.94 });

  const loadTl = gsap.timeline({ defaults: { ease: "power3.out" } });
  loadTl
    .to(".st-mascot-walker", { opacity: 1, y: 0, scale: 1, duration: 1.1 })
    .to(".st-kicker", { opacity: 1, y: 0, duration: 0.65 }, "-=0.55")
    .to(".split-inner", { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.45")
    .to(".st-lede", { opacity: 1, y: 0, duration: 0.75 }, "-=0.5")
    .to(".st-hero-actions", { opacity: 1, y: 0, duration: 0.65 }, "-=0.35");

  loadTl.eventCallback("onComplete", () => {
    gsap.set([".st-kicker", ".st-lede", ".st-hero-actions", ".split-inner"], {
      opacity: 1,
      y: 0,
      clearProps: "opacity,transform",
    });
  });

  initMascotWalkScroll();
  initHeroPatternScroll();
  initShopPatternScroll();

  gsap.utils.toArray(".st-moment-line").forEach((line, i) => {
    gsap.from(line, {
      scrollTrigger: {
        trigger: line,
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
      y: 100,
      opacity: 0,
      duration: 0.95,
      delay: i * 0.1,
      ease: "power3.out",
    });
  });

  gsap.utils.toArray(".st-moment .st-visit-grid .reveal-up").forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
      x: i === 0 ? -60 : 60,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
    });
  });

  gsap.from(".st-moment .st-section-title", {
    scrollTrigger: {
      trigger: ".st-moment .st-section-title",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });

  gsap.from(".st-story-index", {
    scrollTrigger: { trigger: ".st-story", start: "top 80%" },
    x: -40,
    opacity: 0,
    duration: 0.7,
  });

  gsap.from(".st-story-heading", {
    scrollTrigger: { trigger: ".st-story-heading", start: "top 85%" },
    y: 70,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });

  gsap.from(".st-story-body", {
    scrollTrigger: { trigger: ".st-story-body", start: "top 88%" },
    y: 40,
    opacity: 0,
    duration: 0.85,
    delay: 0.15,
  });

  const storyImg = document.querySelector(".st-story-media img");
  if (storyImg) {
    gsap.from(storyImg, {
      scrollTrigger: { trigger: ".st-story-media", start: "top 85%" },
      clipPath: "inset(0 100% 0 0)",
      duration: 1.3,
      ease: "power3.inOut",
    });
    gsap.to(storyImg, {
      scrollTrigger: {
        trigger: ".st-story-media",
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
      y: -40,
      ease: "none",
    });
  }

  gsap.from(".st-community-title", {
    scrollTrigger: { trigger: ".st-community-title", start: "top 82%" },
    scale: 0.82,
    opacity: 0,
    duration: 1.1,
    ease: "back.out(1.6)",
  });

  gsap.utils.toArray(".st-community-list li").forEach((li, i) => {
    gsap.from(li, {
      scrollTrigger: { trigger: li, start: "top 92%" },
      y: 36,
      opacity: 0,
      duration: 0.7,
      delay: i * 0.12,
      ease: "power2.out",
    });
  });

  gsap.from(".st-shop-title", {
    scrollTrigger: { trigger: ".st-shop-title", start: "top 85%" },
    y: 50,
    opacity: 0,
    duration: 0.9,
  });

  gsap.utils.toArray(".st-shop-card").forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: "top 90%" },
      y: 70,
      opacity: 0,
      rotation: i === 0 ? -2.5 : i === 1 ? 1.5 : -1,
      duration: 0.85,
      delay: i * 0.1,
      ease: "back.out(1.35)",
    });
  });

  gsap.utils.toArray(".st-shop-card-media img").forEach((img) => {
    gsap.from(img, {
      scrollTrigger: { trigger: img, start: "top 92%" },
      scale: 1.12,
      duration: 1.4,
      ease: "power2.out",
    });
  });

  gsap.from(".site-footer-insta", {
    scrollTrigger: { trigger: ".site-footer", start: "top 88%" },
    y: 24,
    opacity: 0,
    duration: 0.75,
    ease: "power3.out",
  });

  gsap.from(".site-footer-tagline", {
    scrollTrigger: { trigger: ".site-footer-tagline", start: "top 90%" },
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
  });

  gsap.from(".site-footer-newsletter", {
    scrollTrigger: { trigger: ".site-footer-newsletter", start: "top 88%" },
    y: 50,
    opacity: 0,
    duration: 0.85,
    delay: 0.1,
    ease: "power3.out",
  });

  ScrollTrigger.refresh();
}

function initFixedPatternScroll(bg, cssVar) {
  if (!bg) return;

  const updatePattern = () => {
    bg.style.setProperty(cssVar, `${getPageScrollY()}px`);
  };

  document.body.addEventListener("scroll", updatePattern, { passive: true });
  window.addEventListener("resize", updatePattern);
  window.addEventListener("load", updatePattern);
  updatePattern();
}

(function initInnerPageBgEffects() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  initFixedPatternScroll(document.querySelector(".page--survey-bg"), "--hero-pattern-x");
  initFixedPatternScroll(document.querySelector(".page--jobs-bg"), "--shop-pattern-x");
})();

const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    contactForm.reset();
    showSideTableMessage("Thanks — we'll get back to you soon.");
  });
}
